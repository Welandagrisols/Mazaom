import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product, Customer, Supplier, Transaction, InventoryBatch, User, ScannedReceipt } from "@/types";
import { Platform } from "react-native";

const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

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

async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

async function apiPost<T>(endpoint: string, data: T): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

async function apiPut<T>(endpoint: string, data: T): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

async function apiPatch<T>(endpoint: string, data: T): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

async function apiDelete(endpoint: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export const ProductStorage = {
  async getAll(): Promise<Product[]> {
    try {
      return await apiGet<Product[]>('/api/products');
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },
  async getById(id: string): Promise<Product | null> {
    try {
      return await apiGet<Product>(`/api/products/${id}`);
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },
  async add(product: Product): Promise<boolean> {
    try {
      const result = await apiPost('/api/products', product);
      return result.success;
    } catch (error) {
      console.error('Error adding product:', error);
      return false;
    }
  },
  async update(product: Product): Promise<boolean> {
    try {
      const result = await apiPut(`/api/products/${product.id}`, product);
      return result.success;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  },
  async delete(id: string): Promise<boolean> {
    try {
      const result = await apiDelete(`/api/products/${id}`);
      return result.success;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  },
};

export const CustomerStorage = {
  async getAll(): Promise<Customer[]> {
    try {
      return await apiGet<Customer[]>('/api/customers');
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },
  async add(customer: Customer): Promise<boolean> {
    try {
      const result = await apiPost('/api/customers', customer);
      return result.success;
    } catch (error) {
      console.error('Error adding customer:', error);
      return false;
    }
  },
  async update(customer: Customer): Promise<boolean> {
    try {
      const result = await apiPut(`/api/customers/${customer.id}`, customer);
      return result.success;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  },
};

export const SupplierStorage = {
  async getAll(): Promise<Supplier[]> {
    try {
      return await apiGet<Supplier[]>('/api/suppliers');
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  },
  async add(supplier: Supplier): Promise<boolean> {
    try {
      const result = await apiPost('/api/suppliers', supplier);
      return result.success;
    } catch (error) {
      console.error('Error adding supplier:', error);
      return false;
    }
  },
  async update(supplier: Supplier): Promise<boolean> {
    try {
      const result = await apiPut(`/api/suppliers/${supplier.id}`, supplier);
      return result.success;
    } catch (error) {
      console.error('Error updating supplier:', error);
      return false;
    }
  },
};

export const TransactionStorage = {
  async getAll(): Promise<Transaction[]> {
    try {
      return await apiGet<Transaction[]>('/api/transactions');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },
  async getById(id: string): Promise<Transaction | null> {
    try {
      return await apiGet<Transaction>(`/api/transactions/${id}`);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  },
  async add(transaction: Transaction): Promise<boolean> {
    try {
      const result = await apiPost('/api/transactions', transaction);
      return result.success;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
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
    try {
      return await apiGet<InventoryBatch[]>('/api/batches');
    } catch (error) {
      console.error('Error fetching batches:', error);
      return [];
    }
  },
  async add(batch: InventoryBatch): Promise<boolean> {
    try {
      const result = await apiPost('/api/batches', batch);
      return result.success;
    } catch (error) {
      console.error('Error adding batch:', error);
      return false;
    }
  },
  async update(batch: InventoryBatch): Promise<boolean> {
    try {
      const result = await apiPut(`/api/batches/${batch.id}`, batch);
      return result.success;
    } catch (error) {
      console.error('Error updating batch:', error);
      return false;
    }
  },
  async updateQuantity(id: string, quantity: number): Promise<boolean> {
    try {
      const result = await apiPatch(`/api/batches/${id}/quantity`, { quantity });
      return result.success;
    } catch (error) {
      console.error('Error updating batch quantity:', error);
      return false;
    }
  },
  async save(batches: InventoryBatch[]): Promise<boolean> {
    try {
      for (const batch of batches) {
        await this.update(batch);
      }
      return true;
    } catch (error) {
      console.error("Error saving batches:", error);
      return false;
    }
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
