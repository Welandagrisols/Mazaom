import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product, Customer, Supplier, Transaction, InventoryBatch, User, ScannedReceipt } from "@/types";
import { 
  ProductStorage as DrizzleProductStorage, 
  CustomerStorage as DrizzleCustomerStorage, 
  SupplierStorage as DrizzleSupplierStorage, 
  TransactionStorage as DrizzleTransactionStorage, 
  BatchStorage as DrizzleBatchStorage 
} from "@/lib/storage";

const STORAGE_KEYS = {
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

export const ProductStorage = DrizzleProductStorage;

export const CustomerStorage = DrizzleCustomerStorage;

export const SupplierStorage = DrizzleSupplierStorage;

export const TransactionStorage = {
  ...DrizzleTransactionStorage,
  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const transactions = await DrizzleTransactionStorage.getAll();
    return transactions.filter(
      (t) => t.transactionDate >= startDate && t.transactionDate <= endDate
    );
  },
  async getToday(): Promise<Transaction[]> {
    const today = new Date().toISOString().split("T")[0];
    const transactions = await DrizzleTransactionStorage.getAll();
    return transactions.filter((t) => t.transactionDate.startsWith(today));
  },
};

export const BatchStorage = {
  ...DrizzleBatchStorage,
  async save(batches: InventoryBatch[]): Promise<boolean> {
    try {
      for (const batch of batches) {
        await DrizzleBatchStorage.update(batch);
      }
      return true;
    } catch (error) {
      console.error("Error saving batches:", error);
      return false;
    }
  },
  async getExpiringSoon(days: number = 30): Promise<InventoryBatch[]> {
    const batches = await DrizzleBatchStorage.getAll();
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
