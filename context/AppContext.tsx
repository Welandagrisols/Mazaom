import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Product, Customer, Supplier, Transaction, InventoryBatch, CartItem, User, PurchasePriceRecord, ReceiptProcessingMode, ProcessedReceiptResult, CreditTransaction } from "@/types";
import {
  ProductStorage,
  CustomerStorage,
  SupplierStorage,
  TransactionStorage,
  BatchStorage,
  UserStorage,
  PriceHistoryStorage,
  CreditTransactionStorage,
  generateId,
  generateTransactionNumber,
} from "@/utils/storage";
import { SAMPLE_PRODUCTS, SAMPLE_CUSTOMERS, SAMPLE_SUPPLIERS, generateSampleBatches } from "@/utils/sampleData";
import { ExtractedReceiptData } from "@/utils/openaiVision";

interface AppContextType {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  transactions: Transaction[];
  batches: InventoryBatch[];
  cart: CartItem[];
  user: User | null;
  priceHistory: PurchasePriceRecord[];
  creditTransactions: CreditTransaction[];
  isLoading: boolean;
  loadData: () => Promise<void>;
  addToCart: (product: Product, quantity?: number, fractionalDetails?: { weight: number; totalPrice: number }) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartSubtotal: () => number;
  completeSale: (paymentMethod: string, customerId?: string, discount?: number, notes?: string) => Promise<Transaction | null>;
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  addCustomer: (customer: Omit<Customer, "id">) => Promise<boolean>;
  updateCustomer: (customer: Customer) => Promise<boolean>;
  addSupplier: (supplier: Omit<Supplier, "id">) => Promise<boolean>;
  getProductStock: (productId: string) => number;
  getTodaySales: () => number;
  getTodayTransactionCount: () => number;
  getLowStockProducts: () => Product[];
  searchProducts: (query: string) => Product[];
  processReceiptData: (data: ExtractedReceiptData, mode: ReceiptProcessingMode) => Promise<ProcessedReceiptResult>;
  getPriceHistory: (productId: string) => PurchasePriceRecord[];
  getCustomerCreditHistory: (customerId: string) => CreditTransaction[];
  recordCreditPayment: (customerId: string, amount: number, paymentMethod: string, referenceNumber?: string, notes?: string) => Promise<boolean>;
  getTotalOutstandingDebt: () => number;
  getCustomersWithDebt: () => Customer[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [priceHistory, setPriceHistory] = useState<PurchasePriceRecord[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let loadedProducts = await ProductStorage.getAll();
      let loadedCustomers = await CustomerStorage.getAll();
      let loadedSuppliers = await SupplierStorage.getAll();
      let loadedBatches = await BatchStorage.getAll();
      const loadedTransactions = await TransactionStorage.getAll();
      const loadedUser = await UserStorage.get();
      const loadedPriceHistory = await PriceHistoryStorage.getAll();
      const loadedCreditTransactions = await CreditTransactionStorage.getAll();

      if (loadedProducts.length === 0) {
        loadedProducts = SAMPLE_PRODUCTS;
        await ProductStorage.save(loadedProducts);
      }

      loadedProducts = loadedProducts.map(p => ({
        ...p,
        itemType: p.itemType || (p.isBulkItem ? 'bulk' : 'unit'),
      }));

      if (loadedCustomers.length === 0) {
        loadedCustomers = SAMPLE_CUSTOMERS;
        await CustomerStorage.save(loadedCustomers);
      }

      if (loadedSuppliers.length === 0) {
        loadedSuppliers = SAMPLE_SUPPLIERS;
        await SupplierStorage.save(loadedSuppliers);
      }

      if (loadedBatches.length === 0) {
        loadedBatches = generateSampleBatches(loadedProducts);
        await BatchStorage.save(loadedBatches);
      }

      setProducts(loadedProducts);
      setCustomers(loadedCustomers);
      setSuppliers(loadedSuppliers);
      setTransactions(loadedTransactions);
      setBatches(loadedBatches);
      setUser(loadedUser);
      setPriceHistory(loadedPriceHistory);
      setCreditTransactions(loadedCreditTransactions);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addToCart = useCallback((product: Product, quantity = 1, fractionalDetails?: { weight: number; totalPrice: number }) => {
    setCart((prev) => {
      // For fractional sales, always add as new item (don't combine)
      if (fractionalDetails) {
        return [
          ...prev,
          {
            id: generateId(),
            product,
            quantity: 1,
            unitPrice: fractionalDetails.totalPrice,
            discount: 0,
            actualWeight: fractionalDetails.weight,
            isFractionalSale: true,
          },
        ];
      }
      
      // For regular items, check if already in cart
      const existing = prev.find((item) => item.product.id === product.id && !item.isFractionalSale);
      if (existing) {
        // Update quantity for existing item
        return prev.map((item) =>
          item.product.id === product.id && !item.isFractionalSale
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // Add new item with specified quantity
      return [
        ...prev,
        {
          id: generateId(),
          product,
          quantity,
          unitPrice: product.retailPrice,
          discount: 0,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartSubtotal = useCallback(() => {
    return cart.reduce(
      (total, item) => total + item.unitPrice * item.quantity - item.discount,
      0
    );
  }, [cart]);

  const getCartTotal = useCallback(() => {
    return getCartSubtotal();
  }, [getCartSubtotal]);

  const completeSale = useCallback(
    async (
      paymentMethod: string,
      customerId?: string,
      discount = 0,
      notes?: string
    ): Promise<Transaction | null> => {
      if (cart.length === 0) return null;

      const subtotal = getCartSubtotal();
      const customer = customerId
        ? customers.find((c) => c.id === customerId)
        : undefined;

      const transaction: Transaction = {
        id: generateId(),
        transactionNumber: generateTransactionNumber(),
        customerId,
        customerName: customer?.name,
        userId: user?.id || "guest",
        transactionDate: new Date().toISOString(),
        items: cart.map((item) => ({
          id: generateId(),
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: item.unitPrice * item.quantity - item.discount,
        })),
        subtotal,
        discount,
        tax: 0,
        total: subtotal - discount,
        paymentMethod: paymentMethod as any,
        paymentStatus: "completed",
        notes,
      };

      const success = await TransactionStorage.add(transaction);
      if (success) {
        setTransactions((prev) => [transaction, ...prev]);
        
        for (const item of cart) {
          const productBatches = batches.filter(
            (b) => b.productId === item.product.id
          );
          let remainingQty = item.isFractionalSale && item.actualWeight 
            ? item.actualWeight 
            : item.quantity;
          for (const batch of productBatches) {
            if (remainingQty <= 0) break;
            const deduct = Math.min(batch.quantity, remainingQty);
            batch.quantity -= deduct;
            remainingQty -= deduct;
          }
        }
        await BatchStorage.save(batches);
        setBatches([...batches]);
        
        clearCart();
        return transaction;
      }
      return null;
    },
    [cart, customers, user, batches, getCartSubtotal, clearCart]
  );

  const addProduct = useCallback(
    async (
      productData: Omit<Product, "id" | "createdAt" | "updatedAt">
    ): Promise<boolean> => {
      const product: Product = {
        ...productData,
        itemType: productData.itemType || 'unit',
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const success = await ProductStorage.add(product);
      if (success) {
        setProducts((prev) => [...prev, product]);
      }
      return success;
    },
    []
  );

  const updateProduct = useCallback(async (product: Product): Promise<boolean> => {
    const updatedProduct = { ...product, updatedAt: new Date().toISOString() };
    const success = await ProductStorage.update(updatedProduct);
    if (success) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updatedProduct : p))
      );
    }
    return success;
  }, []);

  const addCustomer = useCallback(
    async (customerData: Omit<Customer, "id">): Promise<boolean> => {
      const customer: Customer = {
        ...customerData,
        id: generateId(),
      };
      const success = await CustomerStorage.add(customer);
      if (success) {
        setCustomers((prev) => [...prev, customer]);
      }
      return success;
    },
    []
  );

  const addSupplier = useCallback(
    async (supplierData: Omit<Supplier, "id">): Promise<boolean> => {
      const supplier: Supplier = {
        ...supplierData,
        id: generateId(),
      };
      const success = await SupplierStorage.add(supplier);
      if (success) {
        setSuppliers((prev) => [...prev, supplier]);
      }
      return success;
    },
    []
  );

  const getProductStock = useCallback(
    (productId: string): number => {
      return batches
        .filter((b) => b.productId === productId)
        .reduce((total, b) => total + b.quantity, 0);
    },
    [batches]
  );

  const getTodaySales = useCallback((): number => {
    const today = new Date().toISOString().split("T")[0];
    return transactions
      .filter((t) => t.transactionDate.startsWith(today))
      .reduce((total, t) => total + t.total, 0);
  }, [transactions]);

  const getTodayTransactionCount = useCallback((): number => {
    const today = new Date().toISOString().split("T")[0];
    return transactions.filter((t) => t.transactionDate.startsWith(today)).length;
  }, [transactions]);

  const getLowStockProducts = useCallback((): Product[] => {
    return products.filter((p) => {
      const stock = getProductStock(p.id);
      return stock <= p.reorderLevel;
    });
  }, [products, getProductStock]);

  const searchProducts = useCallback(
    (query: string): Product[] => {
      if (!query.trim()) return products;
      const lowerQuery = query.toLowerCase();
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.sku.toLowerCase().includes(lowerQuery) ||
          (p.barcode && p.barcode.includes(query))
      );
    },
    [products]
  );

  const getPriceHistory = useCallback(
    (productId: string): PurchasePriceRecord[] => {
      return priceHistory.filter((r) => r.productId === productId);
    },
    [priceHistory]
  );

  const findMatchingProduct = useCallback(
    (itemName: string): Product | null => {
      const lowerName = itemName.toLowerCase().trim();
      const exactMatch = products.find(
        (p) => p.name.toLowerCase() === lowerName
      );
      if (exactMatch) return exactMatch;
      const partialMatch = products.find(
        (p) =>
          p.name.toLowerCase().includes(lowerName) ||
          lowerName.includes(p.name.toLowerCase())
      );
      return partialMatch || null;
    },
    [products]
  );

  const processReceiptData = useCallback(
    async (
      data: ExtractedReceiptData,
      mode: ReceiptProcessingMode
    ): Promise<ProcessedReceiptResult> => {
      const result: ProcessedReceiptResult = {
        newProductsCreated: 0,
        existingProductsUpdated: 0,
        priceRecordsAdded: 0,
        stockAdded: 0,
        mode,
      };

      const newPriceRecords: PurchasePriceRecord[] = [];
      const newBatches: InventoryBatch[] = [];
      const updatedProducts: Product[] = [];
      const createdProducts: Product[] = [];

      for (const item of data.items) {
        let product = findMatchingProduct(item.name);

        if (!product) {
          const newProduct: Product = {
            id: generateId(),
            name: item.name,
            description: `Imported from receipt`,
            category: "feeds",
            sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            unit: item.unit as any || "piece",
            retailPrice: Math.round(item.unitPrice * 1.3),
            wholesalePrice: Math.round(item.unitPrice * 1.15),
            costPrice: item.unitPrice,
            reorderLevel: 10,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            itemType: "unit",
          };
          await ProductStorage.add(newProduct);
          createdProducts.push(newProduct);
          product = newProduct;
          result.newProductsCreated++;
        } else {
          if (product.costPrice !== item.unitPrice) {
            const updatedProduct = {
              ...product,
              costPrice: item.unitPrice,
              updatedAt: new Date().toISOString(),
            };
            await ProductStorage.update(updatedProduct);
            updatedProducts.push(updatedProduct);
            result.existingProductsUpdated++;
          }
        }

        const priceRecord: PurchasePriceRecord = {
          id: generateId(),
          productId: product.id,
          supplierName: data.supplierName,
          purchaseDate: data.date || new Date().toISOString().split("T")[0],
          unitCost: item.unitPrice,
          quantity: item.quantity,
          receiptNumber: data.receiptNumber,
          createdAt: new Date().toISOString(),
        };
        newPriceRecords.push(priceRecord);
        result.priceRecordsAdded++;

        if (mode === "current_stock") {
          const batch: InventoryBatch = {
            id: generateId(),
            productId: product.id,
            batchNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
            quantity: item.quantity,
            purchaseDate: data.date || new Date().toISOString().split("T")[0],
            costPerUnit: item.unitPrice,
          };
          await BatchStorage.add(batch);
          newBatches.push(batch);
          result.stockAdded += item.quantity;
        }
      }

      if (newPriceRecords.length > 0) {
        await PriceHistoryStorage.addMultiple(newPriceRecords);
        setPriceHistory((prev) => [...newPriceRecords, ...prev]);
      }

      if (createdProducts.length > 0) {
        setProducts((prev) => [...prev, ...createdProducts]);
      }

      if (updatedProducts.length > 0) {
        setProducts((prev) =>
          prev.map((p) => {
            const updated = updatedProducts.find((u) => u.id === p.id);
            return updated || p;
          })
        );
      }

      if (newBatches.length > 0) {
        setBatches((prev) => [...prev, ...newBatches]);
      }

      return result;
    },
    [findMatchingProduct]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (email && password.length >= 4) {
        const newUser: User = {
          id: generateId(),
          email,
          fullName: email.split("@")[0],
          role: "cashier",
          active: true,
        };
        await UserStorage.save(newUser);
        setUser(newUser);
        return true;
      }
      return false;
    },
    []
  );

  const logout = useCallback(async () => {
    await UserStorage.clear();
    setUser(null);
    clearCart();
  }, [clearCart]);

  return (
    <AppContext.Provider
      value={{
        products,
        customers,
        suppliers,
        transactions,
        batches,
        cart,
        user,
        priceHistory,
        isLoading,
        loadData,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        getCartTotal,
        getCartSubtotal,
        completeSale,
        addProduct,
        updateProduct,
        addCustomer,
        addSupplier,
        getProductStock,
        getTodaySales,
        getTodayTransactionCount,
        getLowStockProducts,
        searchProducts,
        processReceiptData,
        getPriceHistory,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
