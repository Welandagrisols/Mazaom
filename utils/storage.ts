import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { supabase, isSupabaseConfigured, getSupabaseUrl } from "./supabase";
import { Product, Customer, Supplier, Transaction, InventoryBatch, User, ScannedReceipt, PurchasePriceRecord, CreditTransaction } from "@/types";

const STORAGE_KEYS = {
  PRODUCTS: "@agrovet_products",
  CUSTOMERS: "@agrovet_customers",
  SUPPLIERS: "@agrovet_suppliers",
  TRANSACTIONS: "@agrovet_transactions",
  BATCHES: "@agrovet_batches",
  USER: "@agrovet_user",
  RECEIPTS: "@agrovet_receipts",
  CART: "@agrovet_cart",
  SETTINGS: "@agrovet_settings",
  PRICE_HISTORY: "@agrovet_price_history",
  CREDIT_TRANSACTIONS: "@agrovet_credit_transactions",
  DATA_CLEARED: "@agrovet_data_cleared",
};

async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return false;
  }
}

async function removeItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    return false;
  }
}

export const ProductStorage = {
  async getAll(): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          const products = data.map(mapDbToProduct);
          await setItem(STORAGE_KEYS.PRODUCTS, products);
          return products;
        }
      } catch (error) {
        console.error('Error fetching products from Supabase:', error);
      }
    }
    return (await getItem<Product[]>(STORAGE_KEYS.PRODUCTS)) || [];
  },
  async save(products: Product[]): Promise<boolean> {
    const localSave = await setItem(STORAGE_KEYS.PRODUCTS, products);
    if (isSupabaseConfigured()) {
      try {
        for (const product of products) {
          await supabase.from('products').upsert(mapProductToDb(product));
        }
      } catch (error) {
        console.error('Error syncing products to Supabase:', error);
      }
    }
    return localSave;
  },
  async add(product: Product): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('products').insert(mapProductToDb(product));
        if (error) throw error;
      } catch (error) {
        console.error('Error adding product to Supabase:', error);
      }
    }
    const products = await this.getAll();
    products.push(product);
    return setItem(STORAGE_KEYS.PRODUCTS, products);
  },
  async update(product: Product): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('products')
          .update(mapProductToDb(product))
          .eq('id', product.id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating product in Supabase:', error);
      }
    }
    const products = await this.getAll();
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      return setItem(STORAGE_KEYS.PRODUCTS, products);
    }
    return false;
  },
  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting product from Supabase:', error);
      }
    }
    const products = await this.getAll();
    const filtered = products.filter((p) => p.id !== id);
    return setItem(STORAGE_KEYS.PRODUCTS, filtered);
  },
  async getById(id: string): Promise<Product | null> {
    const products = await this.getAll();
    return products.find((p) => p.id === id) || null;
  },
  async search(query: string): Promise<Product[]> {
    const products = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery) ||
        (p.barcode && p.barcode.includes(query))
    );
  },
};

export const CustomerStorage = {
  async getAll(): Promise<Customer[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          const customers = data.map(mapDbToCustomer);
          await setItem(STORAGE_KEYS.CUSTOMERS, customers);
          return customers;
        }
      } catch (error) {
        console.error('Error fetching customers from Supabase:', error);
      }
    }
    return (await getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS)) || [];
  },
  async save(customers: Customer[]): Promise<boolean> {
    const localSave = await setItem(STORAGE_KEYS.CUSTOMERS, customers);
    if (isSupabaseConfigured()) {
      try {
        for (const customer of customers) {
          await supabase.from('customers').upsert(mapCustomerToDb(customer));
        }
      } catch (error) {
        console.error('Error syncing customers to Supabase:', error);
      }
    }
    return localSave;
  },
  async add(customer: Customer): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('customers').insert(mapCustomerToDb(customer));
        if (error) throw error;
      } catch (error) {
        console.error('Error adding customer to Supabase:', error);
      }
    }
    const customers = await this.getAll();
    customers.push(customer);
    return setItem(STORAGE_KEYS.CUSTOMERS, customers);
  },
  async update(customer: Customer): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('customers')
          .update(mapCustomerToDb(customer))
          .eq('id', customer.id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating customer in Supabase:', error);
      }
    }
    const customers = await this.getAll();
    const index = customers.findIndex((c) => c.id === customer.id);
    if (index !== -1) {
      customers[index] = customer;
      return setItem(STORAGE_KEYS.CUSTOMERS, customers);
    }
    return false;
  },
  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting customer from Supabase:', error);
      }
    }
    const customers = await this.getAll();
    const filtered = customers.filter((c) => c.id !== id);
    return setItem(STORAGE_KEYS.CUSTOMERS, filtered);
  },
  async getById(id: string): Promise<Customer | null> {
    const customers = await this.getAll();
    return customers.find((c) => c.id === id) || null;
  },
};

export const SupplierStorage = {
  async getAll(): Promise<Supplier[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          const suppliers = data.map(mapDbToSupplier);
          await setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
          return suppliers;
        }
      } catch (error) {
        console.error('Error fetching suppliers from Supabase:', error);
      }
    }
    return (await getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS)) || [];
  },
  async save(suppliers: Supplier[]): Promise<boolean> {
    const localSave = await setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    if (isSupabaseConfigured()) {
      try {
        for (const supplier of suppliers) {
          await supabase.from('suppliers').upsert(mapSupplierToDb(supplier));
        }
      } catch (error) {
        console.error('Error syncing suppliers to Supabase:', error);
      }
    }
    return localSave;
  },
  async add(supplier: Supplier): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('suppliers').insert(mapSupplierToDb(supplier));
        if (error) throw error;
      } catch (error) {
        console.error('Error adding supplier to Supabase:', error);
      }
    }
    const suppliers = await this.getAll();
    suppliers.push(supplier);
    return setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  },
  async update(supplier: Supplier): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('suppliers')
          .update(mapSupplierToDb(supplier))
          .eq('id', supplier.id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating supplier in Supabase:', error);
      }
    }
    const suppliers = await this.getAll();
    const index = suppliers.findIndex((s) => s.id === supplier.id);
    if (index !== -1) {
      suppliers[index] = supplier;
      return setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
    }
    return false;
  },
  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting supplier from Supabase:', error);
      }
    }
    const suppliers = await this.getAll();
    const filtered = suppliers.filter((s) => s.id !== id);
    return setItem(STORAGE_KEYS.SUPPLIERS, filtered);
  },
};

export const TransactionStorage = {
  async getAll(): Promise<Transaction[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, transaction_items(*)')
          .order('transaction_date', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          const transactions = data.map(mapDbToTransaction);
          await setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
          return transactions;
        }
      } catch (error) {
        console.error('Error fetching transactions from Supabase:', error);
      }
    }
    return (await getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS)) || [];
  },
  async save(transactions: Transaction[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  },
  async add(transaction: Transaction): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { transactionData, itemsData } = mapTransactionToDb(transaction);
        const { error: txError } = await supabase.from('transactions').insert(transactionData);
        if (txError) throw txError;
        if (itemsData.length > 0) {
          const { error: itemsError } = await supabase.from('transaction_items').insert(itemsData);
          if (itemsError) throw itemsError;
        }
      } catch (error) {
        console.error('Error adding transaction to Supabase:', error);
      }
    }
    const transactions = await this.getAll();
    transactions.unshift(transaction);
    return setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  },
  async getById(id: string): Promise<Transaction | null> {
    const transactions = await this.getAll();
    return transactions.find((t) => t.id === id) || null;
  },
  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const transactions = await this.getAll();
    return transactions.filter(
      (t) => t.transactionDate >= startDate && t.transactionDate <= endDate
    );
  },
  async getToday(): Promise<Transaction[]> {
    const today = new Date().toISOString().split("T")[0];
    const transactions = await this.getAll();
    return transactions.filter((t) => t.transactionDate.startsWith(today));
  },
};

export const BatchStorage = {
  async getAll(): Promise<InventoryBatch[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('inventory_batches')
          .select('*')
          .order('purchase_date', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          const batches = data.map(mapDbToBatch);
          await setItem(STORAGE_KEYS.BATCHES, batches);
          return batches;
        }
      } catch (error) {
        console.error('Error fetching batches from Supabase:', error);
      }
    }
    return (await getItem<InventoryBatch[]>(STORAGE_KEYS.BATCHES)) || [];
  },
  async save(batches: InventoryBatch[]): Promise<boolean> {
    const localSave = await setItem(STORAGE_KEYS.BATCHES, batches);
    if (isSupabaseConfigured()) {
      try {
        for (const batch of batches) {
          await supabase.from('inventory_batches').upsert(mapBatchToDb(batch));
        }
      } catch (error) {
        console.error('Error syncing batches to Supabase:', error);
      }
    }
    return localSave;
  },
  async add(batch: InventoryBatch): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('inventory_batches').insert(mapBatchToDb(batch));
        if (error) throw error;
      } catch (error) {
        console.error('Error adding batch to Supabase:', error);
      }
    }
    const batches = await this.getAll();
    batches.push(batch);
    return setItem(STORAGE_KEYS.BATCHES, batches);
  },
  async getByProductId(productId: string): Promise<InventoryBatch[]> {
    const batches = await this.getAll();
    return batches.filter((b) => b.productId === productId);
  },
  async updateQuantity(batchId: string, quantity: number): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('inventory_batches')
          .update({ quantity })
          .eq('id', batchId);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating batch quantity in Supabase:', error);
      }
    }
    const batches = await this.getAll();
    const index = batches.findIndex((b) => b.id === batchId);
    if (index !== -1) {
      batches[index].quantity = quantity;
      return setItem(STORAGE_KEYS.BATCHES, batches);
    }
    return false;
  },
  async getExpiringSoon(days: number = 30): Promise<InventoryBatch[]> {
    const batches = await this.getAll();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return batches.filter((b) => {
      if (!b.expiryDate) return false;
      const expiry = new Date(b.expiryDate);
      return expiry <= futureDate && expiry >= new Date();
    });
  },
};

export const UserStorage = {
  async get(): Promise<User | null> {
    return getItem<User>(STORAGE_KEYS.USER);
  },
  async save(user: User): Promise<boolean> {
    return setItem(STORAGE_KEYS.USER, user);
  },
  async clear(): Promise<boolean> {
    return removeItem(STORAGE_KEYS.USER);
  },
};

export const ReceiptStorage = {
  async getById(id: string): Promise<ScannedReceipt | null> {
    const receipts = await this.getAll();
    return receipts.find((r) => r.id === id) || null;
  },
  async getAll(): Promise<ScannedReceipt[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('scanned_receipts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          const receipts = data.map(mapDbToReceipt);
          await setItem(STORAGE_KEYS.RECEIPTS, receipts);
          return receipts;
        }
      } catch (error) {
        console.error('Error fetching receipts from Supabase:', error);
      }
    }
    return (await getItem<ScannedReceipt[]>(STORAGE_KEYS.RECEIPTS)) || [];
  },
  async save(receipts: ScannedReceipt[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.RECEIPTS, receipts);
  },
  async add(receipt: ScannedReceipt): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('scanned_receipts').insert(mapReceiptToDb(receipt));
        if (error) throw error;
      } catch (error) {
        console.error('Error adding receipt to Supabase:', error);
      }
    }
    const receipts = await this.getAll();
    receipts.unshift(receipt);
    return setItem(STORAGE_KEYS.RECEIPTS, receipts);
  },
  async update(receipt: ScannedReceipt): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('scanned_receipts')
          .update(mapReceiptToDb(receipt))
          .eq('id', receipt.id);
        if (error) throw error;
      } catch (error) {
        console.error('Error updating receipt in Supabase:', error);
      }
    }
    const receipts = await this.getAll();
    const index = receipts.findIndex((r) => r.id === receipt.id);
    if (index !== -1) {
      receipts[index] = receipt;
      return setItem(STORAGE_KEYS.RECEIPTS, receipts);
    }
    return false;
  },
  async delete(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('scanned_receipts').delete().eq('id', id);
        if (error) throw error;
      } catch (error) {
        console.error('Error deleting receipt from Supabase:', error);
      }
    }
    const receipts = await this.getAll();
    const filtered = receipts.filter((r) => r.id !== id);
    return setItem(STORAGE_KEYS.RECEIPTS, filtered);
  },
};

export const SettingsStorage = {
  async get(): Promise<Record<string, unknown> | null> {
    return getItem<Record<string, unknown>>(STORAGE_KEYS.SETTINGS);
  },
  async save(settings: Record<string, unknown>): Promise<boolean> {
    return setItem(STORAGE_KEYS.SETTINGS, settings);
  },
};

export const PriceHistoryStorage = {
  async getAll(): Promise<PurchasePriceRecord[]> {
    return (await getItem<PurchasePriceRecord[]>(STORAGE_KEYS.PRICE_HISTORY)) || [];
  },
  async save(records: PurchasePriceRecord[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.PRICE_HISTORY, records);
  },
  async add(record: PurchasePriceRecord): Promise<boolean> {
    const records = await this.getAll();
    records.unshift(record);
    return setItem(STORAGE_KEYS.PRICE_HISTORY, records);
  },
  async getByProductId(productId: string): Promise<PurchasePriceRecord[]> {
    const records = await this.getAll();
    return records.filter((r) => r.productId === productId);
  },
  async addMultiple(newRecords: PurchasePriceRecord[]): Promise<boolean> {
    const records = await this.getAll();
    records.unshift(...newRecords);
    return setItem(STORAGE_KEYS.PRICE_HISTORY, records);
  },
};

export const CreditTransactionStorage = {
  async getAll(): Promise<CreditTransaction[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('credit_transactions')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          const transactions = data.map(mapDbToCreditTransaction);
          await setItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, transactions);
          return transactions;
        }
      } catch (error) {
        console.error('Error fetching credit transactions from Supabase:', error);
      }
    }
    return (await getItem<CreditTransaction[]>(STORAGE_KEYS.CREDIT_TRANSACTIONS)) || [];
  },
  async save(transactions: CreditTransaction[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, transactions);
  },
  async add(transaction: CreditTransaction): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('credit_transactions').insert(mapCreditTransactionToDb(transaction));
        if (error) throw error;
      } catch (error) {
        console.error('Error adding credit transaction to Supabase:', error);
      }
    }
    const transactions = await this.getAll();
    transactions.unshift(transaction);
    return setItem(STORAGE_KEYS.CREDIT_TRANSACTIONS, transactions);
  },
  async getByCustomerId(customerId: string): Promise<CreditTransaction[]> {
    const transactions = await this.getAll();
    return transactions.filter((t) => t.customerId === customerId);
  },
};

export const clearAllData = async (): Promise<boolean> => {
  try {
    const keysToRemove = Object.values(STORAGE_KEYS).filter(key => key !== STORAGE_KEYS.DATA_CLEARED);
    await AsyncStorage.multiRemove(keysToRemove);
    await AsyncStorage.setItem(STORAGE_KEYS.DATA_CLEARED, "true");
    return true;
  } catch (error) {
    console.error("Error clearing all data:", error);
    return false;
  }
};

export const wasDataCleared = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.DATA_CLEARED);
    return value === "true";
  } catch (error) {
    return false;
  }
};

export const resetDataClearedFlag = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DATA_CLEARED);
  } catch (error) {
    console.error("Error resetting data cleared flag:", error);
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateTransactionNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `TXN-${dateStr}-${random}`;
};

const RECEIPT_BUCKET = "receipts";

export const uploadReceiptImage = async (localUri: string): Promise<string> => {
  if (!isSupabaseConfigured()) {
    console.log("Supabase not configured, using local URI");
    return localUri;
  }

  try {
    const fileExtension = localUri.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const filePath = `receipts/${fileName}`;
    
    let contentType = "image/jpeg";
    if (fileExtension === "png") contentType = "image/png";
    else if (fileExtension === "pdf") contentType = "application/pdf";
    else if (fileExtension === "gif") contentType = "image/gif";
    else if (fileExtension === "webp") contentType = "image/webp";

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64);

    const { data, error } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return localUri;
    }

    const supabaseUrl = getSupabaseUrl();
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${RECEIPT_BUCKET}/${data.path}`;
    
    console.log("Receipt uploaded successfully:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Error uploading receipt to Supabase Storage:", error);
    return localUri;
  }
};

function mapProductToDb(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    sku: product.sku,
    barcode: product.barcode || null,
    unit: product.unit,
    retail_price: product.retailPrice,
    wholesale_price: product.wholesalePrice,
    cost_price: product.costPrice,
    reorder_level: product.reorderLevel,
    image_url: product.imageUrl || null,
    active: product.active,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    item_type: product.itemType || 'unit',
    is_bulk_item: product.isBulkItem || false,
    package_weight: product.packageWeight || null,
    price_per_kg: product.pricePerKg || null,
    cost_per_kg: product.costPerKg || null,
    bulk_unit: product.bulkUnit || null,
  };
}

function mapDbToProduct(data: Record<string, unknown>): Product {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string,
    category: data.category as Product['category'],
    sku: data.sku as string,
    barcode: data.barcode as string | undefined,
    unit: data.unit as Product['unit'],
    retailPrice: data.retail_price as number,
    wholesalePrice: data.wholesale_price as number,
    costPrice: data.cost_price as number,
    reorderLevel: data.reorder_level as number,
    imageUrl: data.image_url as string | undefined,
    active: data.active as boolean,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    itemType: (data.item_type as Product['itemType']) || 'unit',
    isBulkItem: data.is_bulk_item as boolean | undefined,
    packageWeight: data.package_weight as number | undefined,
    pricePerKg: data.price_per_kg as number | undefined,
    costPerKg: data.cost_per_kg as number | undefined,
    bulkUnit: data.bulk_unit as string | undefined,
  };
}

function mapCustomerToDb(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email || null,
    address: customer.address || null,
    customer_type: customer.customerType,
    credit_limit: customer.creditLimit,
    current_balance: customer.currentBalance,
    loyalty_points: customer.loyaltyPoints,
  };
}

function mapDbToCustomer(data: Record<string, unknown>): Customer {
  return {
    id: data.id as string,
    name: data.name as string,
    phone: data.phone as string,
    email: data.email as string | undefined,
    address: data.address as string | undefined,
    customerType: data.customer_type as Customer['customerType'],
    creditLimit: data.credit_limit as number,
    currentBalance: data.current_balance as number,
    loyaltyPoints: data.loyalty_points as number,
  };
}

function mapSupplierToDb(supplier: Supplier) {
  return {
    id: supplier.id,
    name: supplier.name,
    contact_person: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email || null,
    address: supplier.address || null,
    payment_terms: supplier.paymentTerms || null,
    active: supplier.active,
  };
}

function mapDbToSupplier(data: Record<string, unknown>): Supplier {
  return {
    id: data.id as string,
    name: data.name as string,
    contactPerson: data.contact_person as string,
    phone: data.phone as string,
    email: data.email as string | undefined,
    address: data.address as string | undefined,
    paymentTerms: data.payment_terms as string | undefined,
    active: data.active as boolean,
  };
}

function mapTransactionToDb(transaction: Transaction) {
  const transactionData = {
    id: transaction.id,
    transaction_number: transaction.transactionNumber,
    customer_id: transaction.customerId || null,
    customer_name: transaction.customerName || null,
    user_id: transaction.userId,
    transaction_date: transaction.transactionDate,
    subtotal: transaction.subtotal,
    discount: transaction.discount,
    tax: transaction.tax,
    total: transaction.total,
    payment_method: transaction.paymentMethod,
    payment_status: transaction.paymentStatus,
    reference_number: transaction.referenceNumber || null,
    notes: transaction.notes || null,
  };

  const itemsData = transaction.items.map(item => ({
    id: item.id,
    transaction_id: transaction.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    discount: item.discount,
    total: item.total,
  }));

  return { transactionData, itemsData };
}

function mapDbToTransaction(data: Record<string, unknown>): Transaction {
  const items = (data.transaction_items as Array<Record<string, unknown>> || []).map(item => ({
    id: item.id as string,
    productId: item.product_id as string,
    productName: item.product_name as string,
    quantity: item.quantity as number,
    unitPrice: item.unit_price as number,
    discount: item.discount as number,
    total: item.total as number,
  }));

  return {
    id: data.id as string,
    transactionNumber: data.transaction_number as string,
    customerId: data.customer_id as string | undefined,
    customerName: data.customer_name as string | undefined,
    userId: data.user_id as string,
    transactionDate: data.transaction_date as string,
    items,
    subtotal: data.subtotal as number,
    discount: data.discount as number,
    tax: data.tax as number,
    total: data.total as number,
    paymentMethod: data.payment_method as Transaction['paymentMethod'],
    paymentStatus: data.payment_status as Transaction['paymentStatus'],
    referenceNumber: data.reference_number as string | undefined,
    notes: data.notes as string | undefined,
  };
}

function mapBatchToDb(batch: InventoryBatch) {
  return {
    id: batch.id,
    product_id: batch.productId,
    batch_number: batch.batchNumber,
    quantity: batch.quantity,
    expiry_date: batch.expiryDate || null,
    supplier_id: batch.supplierId || null,
    purchase_date: batch.purchaseDate,
    cost_per_unit: batch.costPerUnit,
  };
}

function mapDbToBatch(data: Record<string, unknown>): InventoryBatch {
  return {
    id: data.id as string,
    productId: data.product_id as string,
    batchNumber: data.batch_number as string,
    quantity: data.quantity as number,
    expiryDate: data.expiry_date as string | undefined,
    supplierId: data.supplier_id as string | undefined,
    purchaseDate: data.purchase_date as string,
    costPerUnit: data.cost_per_unit as number,
  };
}

function mapReceiptToDb(receipt: ScannedReceipt) {
  return {
    id: receipt.id,
    supplier_id: receipt.supplierId || null,
    receipt_date: receipt.receiptDate,
    image_url: receipt.imageUrl,
    ocr_method: receipt.ocrMethod,
    confidence_score: receipt.confidenceScore,
    status: receipt.status,
    extracted_data: receipt.extractedData,
    created_at: receipt.createdAt,
  };
}

function mapDbToReceipt(data: Record<string, unknown>): ScannedReceipt {
  return {
    id: data.id as string,
    supplierId: data.supplier_id as string | undefined,
    receiptDate: data.receipt_date as string,
    imageUrl: data.image_url as string,
    ocrMethod: data.ocr_method as ScannedReceipt['ocrMethod'],
    confidenceScore: data.confidence_score as number,
    status: data.status as ScannedReceipt['status'],
    extractedData: data.extracted_data as ScannedReceipt['extractedData'],
    createdAt: data.created_at as string,
  };
}

function mapCreditTransactionToDb(transaction: CreditTransaction) {
  return {
    id: transaction.id,
    customer_id: transaction.customerId,
    transaction_id: transaction.transactionId || null,
    type: transaction.type,
    amount: transaction.amount,
    balance_before: transaction.balanceBefore,
    balance_after: transaction.balanceAfter,
    payment_method: transaction.paymentMethod || null,
    reference_number: transaction.referenceNumber || null,
    notes: transaction.notes || null,
    created_at: transaction.createdAt,
    created_by: transaction.createdBy || null,
  };
}

function mapDbToCreditTransaction(data: Record<string, unknown>): CreditTransaction {
  return {
    id: data.id as string,
    customerId: data.customer_id as string,
    transactionId: data.transaction_id as string | undefined,
    type: data.type as CreditTransaction['type'],
    amount: data.amount as number,
    balanceBefore: data.balance_before as number,
    balanceAfter: data.balance_after as number,
    paymentMethod: data.payment_method as string | undefined,
    referenceNumber: data.reference_number as string | undefined,
    notes: data.notes as string | undefined,
    createdAt: data.created_at as string,
    createdBy: data.created_by as string | undefined,
  };
}
