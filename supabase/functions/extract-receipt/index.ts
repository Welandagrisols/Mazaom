import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractedItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit?: string
}

interface ExtractedReceiptData {
  supplierName?: string
  receiptNumber?: string
  date?: string
  items: ExtractedItem[]
  subtotal?: number
  tax?: number
  total?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing')
    }

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured in Supabase secrets')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired authentication token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    console.log('Authenticated user:', user.id)

    const { imageData } = await req.json()
    
    if (!imageData) {
      throw new Error('No image data provided')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      
      if (response.status === 401) {
        throw new Error('OpenAI API authentication failed. Please check that your API key is valid.')
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.')
      }
      
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response content from OpenAI')
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from OpenAI response')
    }

    const extractedData: ExtractedReceiptData = JSON.parse(jsonMatch[0])
    
    if (!extractedData.items) {
      extractedData.items = []
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
