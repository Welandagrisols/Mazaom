import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl = process.env.SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Please check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Tables = {
  products: {
    id: string;
    name: string;
    description: string;
    category: string;
    sku: string;
    barcode: string | null;
    unit: string;
    retail_price: number;
    wholesale_price: number;
    cost_price: number;
    reorder_level: number;
    image_url: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
  };
  inventory_batches: {
    id: string;
    product_id: string;
    batch_number: string;
    quantity: number;
    expiry_date: string | null;
    supplier_id: string | null;
    purchase_date: string;
    cost_per_unit: number;
    created_at: string;
  };
  customers: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    customer_type: string;
    credit_limit: number;
    current_balance: number;
    loyalty_points: number;
    created_at: string;
  };
  suppliers: {
    id: string;
    name: string;
    contact_person: string;
    phone: string;
    email: string | null;
    address: string | null;
    payment_terms: string | null;
    active: boolean;
    created_at: string;
  };
  transactions: {
    id: string;
    transaction_number: string;
    customer_id: string | null;
    customer_name: string | null;
    user_id: string;
    transaction_date: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    payment_method: string;
    payment_status: string;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
  };
  transaction_items: {
    id: string;
    transaction_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
  };
  users: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    phone: string | null;
    active: boolean;
    created_at: string;
  };
};
