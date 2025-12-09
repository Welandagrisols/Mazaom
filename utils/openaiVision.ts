import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const getApiKey = (): string => {
  return process.env.OPENAI_API_KEY || 
         Constants.expoConfig?.extra?.openaiApiKey || 
         (typeof window !== 'undefined' && (window as unknown as Record<string, string>).OPENAI_API_KEY) ||
         '';
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
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
      base64Image = `data:${mimeType};base64,${base64}`;
    }

    console.log('[OpenAI] Calling OpenAI API with gpt-4o model');
    const response = await getOpenAI().chat.completions.create({
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
