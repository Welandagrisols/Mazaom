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
  itemType: ItemType;
  isBulkItem?: boolean;
  packageWeight?: number;
  pricePerKg?: number;
  costPerKg?: number;
  bulkUnit?: string;
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
  actualWeight?: number;
  isFractionalSale?: boolean;
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

export type ReceiptProcessingMode = "historical" | "current_stock";

export interface PurchasePriceRecord {
  id: string;
  productId: string;
  supplierId?: string;
  supplierName?: string;
  purchaseDate: string;
  unitCost: number;
  quantity: number;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface ProcessedReceiptResult {
  newProductsCreated: number;
  existingProductsUpdated: number;
  priceRecordsAdded: number;
  stockAdded: number;
  mode: ReceiptProcessingMode;
}

export interface CreditTransaction {
  id: string;
  customerId: string;
  transactionId?: string;
  type: "credit_sale" | "payment" | "adjustment";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export type UserRole = "admin" | "manager" | "cashier";

export interface Shop {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  currency: string;
  receiptFooter?: string;
  shopCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  shopId: string;
  role: UserRole;
  active: boolean;
  pin?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserRole_DB {
  id: string;
  userId: string;
  shopId: string;
  role: UserRole;
  createdAt: string;
}

export interface LicenseKey {
  id: string;
  key: string;
  shopName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isUsed: boolean;
  usedAt?: string;
  usedByShopId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface StaffMember {
  id: string;
  fullName: string;
  pin: string;
  role: UserRole;
  shopId: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}
