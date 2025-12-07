import OpenAI from 'openai';
import * as FileSystem from 'expo-file-system';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

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
    let base64Image: string;
    
    if (imageUri.startsWith('data:')) {
      base64Image = imageUri;
    } else {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = imageUri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
      base64Image = `data:${mimeType};base64,${base64}`;
    }

    const response = await openai.chat.completions.create({
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

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const extractedData = JSON.parse(jsonMatch[0]) as ExtractedReceiptData;
    
    if (!extractedData.items) {
      extractedData.items = [];
    }

    return extractedData;
  } catch (error) {
    console.error('OpenAI Vision Error:', error);
    throw error;
  }
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
