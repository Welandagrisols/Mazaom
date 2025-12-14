-- AgroVet POS Supabase Schema
-- Run this script in your Supabase SQL Editor to create the required tables

-- Shops table (needed for multi-shop support)
CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  logo TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_id TEXT,
  currency TEXT DEFAULT 'KES',
  receipt_footer TEXT,
  shop_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (for staff authentication)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  auth_id TEXT UNIQUE,
  email TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  shop_id TEXT REFERENCES shops(id),
  role TEXT NOT NULL DEFAULT 'cashier',
  active BOOLEAN DEFAULT true,
  pin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- License keys table (for subscription validation)
CREATE TABLE IF NOT EXISTS license_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  key TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  used_by_shop_id TEXT REFERENCES shops(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  unit TEXT NOT NULL,
  retail_price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  reorder_level INTEGER DEFAULT 0,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_bulk_item BOOLEAN DEFAULT false,
  package_weight DECIMAL(10,2),
  price_per_kg DECIMAL(10,2),
  cost_per_kg DECIMAL(10,2)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  customer_type TEXT DEFAULT 'retail',
  credit_limit DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  payment_terms TEXT,
  active BOOLEAN DEFAULT true
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id),
  customer_name TEXT,
  user_id TEXT NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'completed',
  reference_number TEXT,
  notes TEXT
);

-- Transaction items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL
);

-- Inventory batches table
CREATE TABLE IF NOT EXISTS inventory_batches (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  expiry_date DATE,
  supplier_id TEXT REFERENCES suppliers(id),
  purchase_date DATE NOT NULL,
  cost_per_unit DECIMAL(10,2) NOT NULL
);

-- Scanned receipts table
CREATE TABLE IF NOT EXISTS scanned_receipts (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES suppliers(id),
  receipt_date DATE NOT NULL,
  image_url TEXT NOT NULL,
  ocr_method TEXT NOT NULL,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  extracted_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions table (for customer credit management)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price history table (for tracking price changes)
CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  old_retail_price DECIMAL(10,2),
  new_retail_price DECIMAL(10,2),
  old_wholesale_price DECIMAL(10,2),
  new_wholesale_price DECIMAL(10,2),
  old_cost_price DECIMAL(10,2),
  new_cost_price DECIMAL(10,2),
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_product ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_users_shop ON users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin);
CREATE INDEX IF NOT EXISTS idx_shops_code ON shops(shop_code);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_customer ON credit_transactions(customer_id);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all on shops" ON shops FOR ALL USING (true);
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on license_keys" ON license_keys FOR ALL USING (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all on suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all on transaction_items" ON transaction_items FOR ALL USING (true);
CREATE POLICY "Allow all on inventory_batches" ON inventory_batches FOR ALL USING (true);
CREATE POLICY "Allow all on scanned_receipts" ON scanned_receipts FOR ALL USING (true);
CREATE POLICY "Allow all on credit_transactions" ON credit_transactions FOR ALL USING (true);
CREATE POLICY "Allow all on price_history" ON price_history FOR ALL USING (true);
