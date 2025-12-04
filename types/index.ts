import { CategoryId, UnitId, PaymentMethodId } from "@/constants/categories";

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
