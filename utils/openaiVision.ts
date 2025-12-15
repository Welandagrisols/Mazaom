import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { getSupabase, isSupabaseConfigured } from './supabase';

const getApiKey = (): string => {
  const envKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
  const expoKey = Constants.expoConfig?.extra?.openaiApiKey;
  const windowKey = typeof window !== 'undefined' && ((window as unknown as Record<string, string>).OPENAI_API_KEY || (window as unknown as Record<string, string>).OPEN_AI_KEY);
  
  const apiKey = envKey || expoKey || windowKey || '';
  
  if (!apiKey) {
    console.log('[OpenAI] API key not found locally (will use Edge Function if available)');
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

async function prepareImageData(imageUri: string): Promise<string> {
  if (imageUri.startsWith('data:')) {
    console.log('[OpenAI] Using data URI directly');
    return imageUri;
  } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    console.log('[OpenAI] Using cloud URL directly');
    return imageUri;
  } else {
    console.log('[OpenAI] Reading local file as base64');
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as const,
      });
      const mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
      const result = `data:${mimeType};base64,${base64}`;
      console.log('[OpenAI] Successfully converted to base64, size:', base64.length);
      return result;
    } catch (fileError) {
      console.error('[OpenAI] Error reading file:', fileError);
      throw new Error(`Failed to read image file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
    }
  }
}

async function extractViaEdgeFunction(imageData: string): Promise<ExtractedReceiptData> {
  console.log('[OpenAI] Attempting extraction via Supabase Edge Function...');
  
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.functions.invoke('extract-receipt', {
    body: { imageData },
  });

  if (error) {
    console.error('[OpenAI] Edge Function error:', error);
    throw new Error(`Edge Function failed: ${error.message}`);
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Edge Function returned unsuccessful response');
  }

  console.log('[OpenAI] Edge Function extraction successful');
  return data.data as ExtractedReceiptData;
}

async function extractViaDirectApi(imageData: string): Promise<ExtractedReceiptData> {
  console.log('[OpenAI] Using direct API call (fallback)...');
  
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please ensure OPENAI_API_KEY is set in your environment variables or Replit Secrets.');
  }

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
              url: imageData,
              detail: 'high'
            }
          }
        ]
      }
    ],
    max_tokens: 2000,
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI API.');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from OpenAI response.');
  }

  const extractedData = JSON.parse(jsonMatch[0]) as ExtractedReceiptData;
  if (!extractedData.items) {
    extractedData.items = [];
  }

  return extractedData;
}

export async function extractReceiptData(imageUri: string): Promise<ExtractedReceiptData> {
  try {
    console.log('[OpenAI] Starting extraction for image:', imageUri.substring(0, 50) + '...');
    
    const imageData = await prepareImageData(imageUri);
    
    if (isSupabaseConfigured()) {
      try {
        return await extractViaEdgeFunction(imageData);
      } catch (edgeFunctionError) {
        console.warn('[OpenAI] Edge Function failed, falling back to direct API:', edgeFunctionError);
      }
    }
    
    return await extractViaDirectApi(imageData);
  } catch (error) {
    console.error('[OpenAI] Vision Error:', error);
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('authentication')) {
        throw new Error('OpenAI API authentication failed. Please check that your API key is valid and has sufficient credits.');
      } else if (error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error: Unable to reach OpenAI API. Please check your internet connection.');
      }
      throw new Error(`OpenAI extraction failed: ${error.message}`);
    }
    throw error;
  }
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getApiKey()) || isSupabaseConfigured();
}
