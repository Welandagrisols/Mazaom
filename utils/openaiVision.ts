import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const getApiKey = (): string => {
  // Check multiple sources for API key
  const envKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
  const expoKey = Constants.expoConfig?.extra?.openaiApiKey;
  const windowKey = typeof window !== 'undefined' && ((window as unknown as Record<string, string>).OPENAI_API_KEY || (window as unknown as Record<string, string>).OPEN_AI_KEY);
  
  const apiKey = envKey || expoKey || windowKey || '';
  
  if (!apiKey) {
    console.error('[OpenAI] API key not found in any source');
    console.log('[OpenAI] Checked:', {
      hasEnvKey: !!envKey,
      hasExpoKey: !!expoKey,
      hasWindowKey: !!windowKey,
    });
  } else {
    console.log('[OpenAI] API key found, length:', apiKey.length);
  }
  
  return apiKey;
};

let _openai: OpenAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!_openai) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    _openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return _openai;
};

export interface ExtractedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
}

export interface ExtractedReceiptData {
  supplierName?: string;
  receiptNumber?: string;
  date?: string;
  items: ExtractedItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
}

export async function extractReceiptData(imageUri: string): Promise<ExtractedReceiptData> {
  try {
    console.log('[OpenAI] Starting extraction for image:', imageUri.substring(0, 50) + '...');
    
    // Verify API key before proceeding
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please ensure OPENAI_API_KEY is set in your environment variables or Replit Secrets.');
    }
    console.log('[OpenAI] API key verified');
    
    let base64Image: string;
    
    if (imageUri.startsWith('data:')) {
      base64Image = imageUri;
      console.log('[OpenAI] Using data URI directly');
    } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      // For cloud URLs, pass directly to OpenAI
      base64Image = imageUri;
      console.log('[OpenAI] Using cloud URL directly');
    } else {
      console.log('[OpenAI] Reading local file as base64');
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64' as const,
        });
        const mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        base64Image = `data:${mimeType};base64,${base64}`;
        console.log('[OpenAI] Successfully converted to base64, size:', base64.length);
      } catch (fileError) {
        console.error('[OpenAI] Error reading file:', fileError);
        throw new Error(`Failed to read image file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }

    console.log('[OpenAI] Calling OpenAI API with gpt-4o model');
    console.log('[OpenAI] Image type:', base64Image.startsWith('data:') ? 'base64' : 'URL');
    
    let response;
    try {
      response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a receipt OCR assistant for an agricultural/veterinary supply store. 
Extract structured data from purchase receipts. Focus on identifying:
- Supplier/vendor name
- Receipt/invoice number
- Date of purchase
- Individual items with their quantities, unit prices, and totals
- Subtotal, tax, and grand total

Common product categories: animal feeds, fertilizers, pesticides, herbicides, veterinary medicines, seeds, poultry supplies, livestock equipment.

Return ONLY valid JSON in this exact format:
{
  "supplierName": "string or null",
  "receiptNumber": "string or null", 
  "date": "YYYY-MM-DD or null",
  "items": [
    {
      "name": "product name",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "unit": "bags/bottles/kg/liters/pieces/etc"
    }
  ],
  "subtotal": number or null,
  "tax": number or null,
  "total": number or null
}

If you cannot read certain values, use reasonable defaults or null. Prices should be in the local currency (KES - Kenyan Shillings if visible, otherwise use the numbers shown).`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract all product and pricing information from this receipt image. Return the data as JSON.'
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });
    } catch (apiError) {
      console.error('[OpenAI] API call failed:', apiError);
      if (apiError instanceof Error) {
        // Check for common API errors
        if (apiError.message.includes('401') || apiError.message.includes('authentication')) {
          throw new Error('OpenAI API authentication failed. Please check that your API key is valid and has sufficient credits.');
        } else if (apiError.message.includes('429')) {
          throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
        } else if (apiError.message.includes('network') || apiError.message.includes('fetch')) {
          throw new Error('Network error: Unable to reach OpenAI API. Please check your internet connection.');
        }
        throw new Error(`OpenAI API error: ${apiError.message}`);
      }
      throw new Error('Failed to call OpenAI API. Please try again.');
    }

    console.log('[OpenAI] Received response from API');
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI API. Please check your API key and try again.');
    }

    console.log('[OpenAI] Response content:', content.substring(0, 200) + '...');
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[OpenAI] Could not find JSON in response:', content);
      throw new Error('Could not parse JSON from OpenAI response. The image may not contain readable receipt data.');
    }

    const extractedData = JSON.parse(jsonMatch[0]) as ExtractedReceiptData;
    console.log('[OpenAI] Successfully parsed data. Items found:', extractedData.items?.length || 0);
    
    if (!extractedData.items) {
      extractedData.items = [];
    }

    if (extractedData.items.length === 0) {
      console.warn('[OpenAI] No items extracted from receipt');
    }

    return extractedData;
  } catch (error) {
    console.error('[OpenAI] Vision Error:', error);
    if (error instanceof Error) {
      // Re-throw with more context
      throw new Error(`OpenAI extraction failed: ${error.message}`);
    }
    throw error;
  }
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getApiKey());
}
