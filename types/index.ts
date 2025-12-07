import { CategoryId, UnitId, PaymentMethodId } from "@/constants/categories";

export type ItemType = 'bulk' | 'unit';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  sku: string;
  barcode?: string;
  unit: UnitId;
  retailPrice: number;
  wholesalePrice: number;
  costPrice: number;
  reorderLevel: number;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  // Item type: 'bulk' for divisible items sold by weight/volume, 'unit' for whole items only
  itemType: ItemType;
  // Bulk sale properties (only used when itemType is 'bulk')
  isBulkItem?: boolean; // Deprecated - use itemType instead
  packageWeight?: number; // Total weight of full package (e.g., 70kg bag)
  pricePerKg?: number; // Retail price per kg/liter
  costPerKg?: number; // Cost price per kg/liter
  bulkUnit?: string; // Unit for bulk sales (kg, liters, etc.)
}

export interface InventoryBatch {
  id: string;
  productId: string;
  batchNumber: string;
  quantity: number;
  expiryDate?: string;
  supplierId?: string;
  purchaseDate: string;
  costPerUnit: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customerType: "retail" | "wholesale" | "vip";
  creditLimit: number;
  currentBalance: number;
  loyaltyPoints: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  batchId?: string;
  // For bulk items sold by weight
  actualWeight?: number; // Weight sold (e.g., 2.5 kg from a 70kg bag)
  isFractionalSale?: boolean; // True if sold by weight
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  customerId?: string;
  customerName?: string;
  userId: string;
  transactionDate: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethodId;
  paymentStatus: "pending" | "completed" | "refunded" | "partial";
  referenceNumber?: string;
  notes?: string;
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  transactionCount: number;
  topProducts: { productId: string; name: string; quantity: number }[];
  paymentBreakdown: { method: PaymentMethodId; amount: number }[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "cashier";
  phone?: string;
  active: boolean;
}

export interface ScannedReceipt {
  id: string;
  supplierId?: string;
  receiptDate: string;
  imageUrl: string;
  ocrMethod: "tesseract" | "google_vision";
  confidenceScore: number;
  status: "pending" | "reviewed" | "confirmed";
  extractedData: ExtractedReceiptData;
  createdAt: string;
}

export interface ExtractedReceiptData {
  items: ExtractedItem[];
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  taxAmount?: number;
}

export interface ExtractedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  batchNumber?: string;
  expiryDate?: string;
  matchedProductId?: string;
  confidence: "high" | "medium" | "low";
}
