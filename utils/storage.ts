import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product, Customer, Supplier, Transaction, InventoryBatch, User, ScannedReceipt } from "@/types";

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
    return (await getItem<Product[]>(STORAGE_KEYS.PRODUCTS)) || [];
  },
  async save(products: Product[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.PRODUCTS, products);
  },
  async add(product: Product): Promise<boolean> {
    const products = await this.getAll();
    products.push(product);
    return this.save(products);
  },
  async update(product: Product): Promise<boolean> {
    const products = await this.getAll();
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      return this.save(products);
    }
    return false;
  },
  async delete(id: string): Promise<boolean> {
    const products = await this.getAll();
    const filtered = products.filter((p) => p.id !== id);
    return this.save(filtered);
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
    return (await getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS)) || [];
  },
  async save(customers: Customer[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.CUSTOMERS, customers);
  },
  async add(customer: Customer): Promise<boolean> {
    const customers = await this.getAll();
    customers.push(customer);
    return this.save(customers);
  },
  async update(customer: Customer): Promise<boolean> {
    const customers = await this.getAll();
    const index = customers.findIndex((c) => c.id === customer.id);
    if (index !== -1) {
      customers[index] = customer;
      return this.save(customers);
    }
    return false;
  },
  async delete(id: string): Promise<boolean> {
    const customers = await this.getAll();
    const filtered = customers.filter((c) => c.id !== id);
    return this.save(filtered);
  },
  async getById(id: string): Promise<Customer | null> {
    const customers = await this.getAll();
    return customers.find((c) => c.id === id) || null;
  },
};

export const SupplierStorage = {
  async getAll(): Promise<Supplier[]> {
    return (await getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS)) || [];
  },
  async save(suppliers: Supplier[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  },
  async add(supplier: Supplier): Promise<boolean> {
    const suppliers = await this.getAll();
    suppliers.push(supplier);
    return this.save(suppliers);
  },
  async update(supplier: Supplier): Promise<boolean> {
    const suppliers = await this.getAll();
    const index = suppliers.findIndex((s) => s.id === supplier.id);
    if (index !== -1) {
      suppliers[index] = supplier;
      return this.save(suppliers);
    }
    return false;
  },
  async delete(id: string): Promise<boolean> {
    const suppliers = await this.getAll();
    const filtered = suppliers.filter((s) => s.id !== id);
    return this.save(filtered);
  },
};

export const TransactionStorage = {
  async getAll(): Promise<Transaction[]> {
    return (await getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS)) || [];
  },
  async save(transactions: Transaction[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  },
  async add(transaction: Transaction): Promise<boolean> {
    const transactions = await this.getAll();
    transactions.unshift(transaction);
    return this.save(transactions);
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
    return (await getItem<InventoryBatch[]>(STORAGE_KEYS.BATCHES)) || [];
  },
  async save(batches: InventoryBatch[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.BATCHES, batches);
  },
  async add(batch: InventoryBatch): Promise<boolean> {
    const batches = await this.getAll();
    batches.push(batch);
    return this.save(batches);
  },
  async getByProductId(productId: string): Promise<InventoryBatch[]> {
    const batches = await this.getAll();
    return batches.filter((b) => b.productId === productId);
  },
  async updateQuantity(batchId: string, quantity: number): Promise<boolean> {
    const batches = await this.getAll();
    const index = batches.findIndex((b) => b.id === batchId);
    if (index !== -1) {
      batches[index].quantity = quantity;
      return this.save(batches);
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
  async getAll(): Promise<ScannedReceipt[]> {
    return (await getItem<ScannedReceipt[]>(STORAGE_KEYS.RECEIPTS)) || [];
  },
  async save(receipts: ScannedReceipt[]): Promise<boolean> {
    return setItem(STORAGE_KEYS.RECEIPTS, receipts);
  },
  async add(receipt: ScannedReceipt): Promise<boolean> {
    const receipts = await this.getAll();
    receipts.unshift(receipt);
    return this.save(receipts);
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

export const clearAllData = async (): Promise<boolean> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch (error) {
    console.error("Error clearing all data:", error);
    return false;
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
