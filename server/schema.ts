import { pgTable, text, decimal, integer, boolean, timestamp, date, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const products = pgTable("products", {
  id: text("id").primaryKey().default(sql`uuid_generate_v4()::text`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  unit: text("unit").notNull(),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull().default("0"),
  wholesalePrice: decimal("wholesale_price", { precision: 10, scale: 2 }).notNull().default("0"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull().default("0"),
  reorderLevel: integer("reorder_level").notNull().default(10),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`NOW()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`NOW()`),
});

export const inventoryBatches = pgTable("inventory_batches", {
  id: text("id").primaryKey().default(sql`uuid_generate_v4()::text`),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  batchNumber: text("batch_number").notNull(),
  quantity: integer("quantity").notNull().default(0),
  expiryDate: date("expiry_date"),
  supplierId: text("supplier_id"),
  purchaseDate: date("purchase_date").notNull().default(sql`CURRENT_DATE`),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`NOW()`),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey().default(sql`uuid_generate_v4()::text`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  customerType: text("customer_type").notNull().default("retail"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).notNull().default("0"),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`NOW()`),
});

export const suppliers = pgTable("suppliers", {
  id: text("id").primaryKey().default(sql`uuid_generate_v4()::text`),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  paymentTerms: text("payment_terms"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`NOW()`),
});

export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`uuid_generate_v4()::text`),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("cashier"),
  phone: text("phone"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`NOW()`),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().default(sql`uuid_generate_v4()::text`),
  transactionNumber: text("transaction_number").notNull().unique(),
  customerId: text("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  userId: text("user_id").notNull(),
  transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull().default(sql`NOW()`),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`NOW()`),
});

export const transactionItems = pgTable("transaction_items", {
  id: text("id").primaryKey().default(sql`uuid_generate_v4()::text`),
  transactionId: text("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});
