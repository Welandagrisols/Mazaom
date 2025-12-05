-- AgroVet POS Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  unit TEXT NOT NULL,
  retail_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  wholesale_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory Batches Table
CREATE TABLE IF NOT EXISTS inventory_batches (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  supplier_id TEXT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  customer_type TEXT NOT NULL DEFAULT 'retail',
  credit_limit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  payment_terms TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier',
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  transaction_number TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES customers(id),
  customer_name TEXT,
  user_id TEXT NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transaction Items Table
CREATE TABLE IF NOT EXISTS transaction_items (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_product_id ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry_date ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);

-- Enable Row Level Security (RLS) - Optional, enable as needed
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (development mode)
-- In production, you should create more restrictive policies

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - remove if you want to start fresh)
-- Products
INSERT INTO products (id, name, description, category, sku, unit, retail_price, wholesale_price, cost_price, reorder_level) VALUES
  ('prod-001', 'Dairy Meal 70kg', 'High protein dairy meal for cattle', 'feeds', 'FM-001', 'bags', 3500, 3200, 2800, 10),
  ('prod-002', 'Chick Mash 25kg', 'Starter feed for chicks', 'poultry', 'PM-001', 'bags', 2200, 2000, 1800, 15),
  ('prod-003', 'NPK Fertilizer 50kg', 'Compound fertilizer for crops', 'fertilizers', 'FT-001', 'bags', 4500, 4200, 3800, 20),
  ('prod-004', 'Duduthrin 1L', 'General purpose insecticide', 'pesticides', 'PS-001', 'bottles', 850, 750, 600, 25),
  ('prod-005', 'Roundup 1L', 'Non-selective herbicide', 'herbicides', 'HB-001', 'bottles', 1200, 1050, 900, 20),
  ('prod-006', 'Ivermectin 50ml', 'Anti-parasitic for livestock', 'veterinary', 'VT-001', 'bottles', 650, 550, 450, 30),
  ('prod-007', 'Hybrid Maize Seeds 2kg', 'High yield maize variety', 'seeds', 'SD-001', 'packets', 450, 400, 320, 50),
  ('prod-008', 'Albendazole 10%', 'Dewormer for livestock', 'veterinary', 'VT-002', 'bottles', 450, 380, 300, 25)
ON CONFLICT (sku) DO NOTHING;

-- Inventory Batches
INSERT INTO inventory_batches (product_id, batch_number, quantity, expiry_date, purchase_date, cost_per_unit) VALUES
  ('prod-001', 'BATCH-001', 45, '2025-12-01', CURRENT_DATE, 2800),
  ('prod-002', 'BATCH-002', 30, '2025-10-15', CURRENT_DATE, 1800),
  ('prod-003', 'BATCH-003', 60, '2026-03-01', CURRENT_DATE, 3800),
  ('prod-004', 'BATCH-004', 40, '2025-08-20', CURRENT_DATE, 600),
  ('prod-005', 'BATCH-005', 35, '2025-09-10', CURRENT_DATE, 900),
  ('prod-006', 'BATCH-006', 50, '2025-07-30', CURRENT_DATE, 450),
  ('prod-007', 'BATCH-007', 100, '2026-01-15', CURRENT_DATE, 320),
  ('prod-008', 'BATCH-008', 45, '2025-11-20', CURRENT_DATE, 300)
ON CONFLICT DO NOTHING;

-- Customers
INSERT INTO customers (id, name, phone, email, address, customer_type, credit_limit, loyalty_points) VALUES
  ('cust-001', 'John Mwangi', '+254712345678', 'john@example.com', 'Kiambu, Kenya', 'retail', 50000, 150),
  ('cust-002', 'Mary Wanjiku', '+254723456789', NULL, 'Thika, Kenya', 'wholesale', 200000, 500),
  ('cust-003', 'Peter Ochieng', '+254734567890', 'peter@farmersgroup.co.ke', 'Nakuru, Kenya', 'vip', 500000, 2000)
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address, payment_terms) VALUES
  ('supp-001', 'Unga Holdings Ltd', 'James Kamau', '+254720111222', 'supplies@unga.co.ke', 'Industrial Area, Nairobi', 'Net 30'),
  ('supp-002', 'Osho Chemicals', 'Sarah Akinyi', '+254721333444', 'orders@osho.co.ke', 'Mombasa Road, Nairobi', 'Net 14'),
  ('supp-003', 'Kenya Seed Company', 'David Kiprop', '+254722555666', 'sales@kenyaseed.co.ke', 'Kitale, Kenya', 'Net 30')
ON CONFLICT DO NOTHING;
