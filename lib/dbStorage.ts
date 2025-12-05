import { db } from "../server/db";
import { products, inventoryBatches, customers, suppliers, transactions, transactionItems, users } from "../server/schema";
import { Product, Customer, Supplier, Transaction, InventoryBatch, User, TransactionItem } from "@/types";
import { eq, desc } from "drizzle-orm";

const mapProductFromDb = (row: any): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  sku: row.sku,
  barcode: row.barcode,
  unit: row.unit,
  retailPrice: parseFloat(row.retailPrice || "0"),
  wholesalePrice: parseFloat(row.wholesalePrice || "0"),
  costPrice: parseFloat(row.costPrice || "0"),
  reorderLevel: row.reorderLevel,
  imageUrl: row.imageUrl,
  active: row.active,
  createdAt: row.createdAt?.toISOString(),
  updatedAt: row.updatedAt?.toISOString(),
});

const mapBatchFromDb = (row: any): InventoryBatch => ({
  id: row.id,
  productId: row.productId,
  batchNumber: row.batchNumber,
  quantity: row.quantity,
  expiryDate: row.expiryDate?.toISOString()?.split('T')[0] || null,
  supplierId: row.supplierId,
  purchaseDate: row.purchaseDate?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
  costPerUnit: parseFloat(row.costPerUnit || "0"),
});

const mapCustomerFromDb = (row: any): Customer => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  customerType: row.customerType,
  creditLimit: parseFloat(row.creditLimit || "0"),
  currentBalance: parseFloat(row.currentBalance || "0"),
  loyaltyPoints: row.loyaltyPoints,
});

const mapSupplierFromDb = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  contactPerson: row.contactPerson,
  phone: row.phone,
  email: row.email,
  address: row.address,
  paymentTerms: row.paymentTerms,
  active: row.active,
});

const mapTransactionFromDb = (row: any, items: TransactionItem[]): Transaction => ({
  id: row.id,
  transactionNumber: row.transactionNumber,
  customerId: row.customerId,
  customerName: row.customerName,
  userId: row.userId,
  transactionDate: row.transactionDate?.toISOString(),
  items: items,
  subtotal: parseFloat(row.subtotal || "0"),
  discount: parseFloat(row.discount || "0"),
  tax: parseFloat(row.tax || "0"),
  total: parseFloat(row.total || "0"),
  paymentMethod: row.paymentMethod,
  paymentStatus: row.paymentStatus,
  referenceNumber: row.referenceNumber,
  notes: row.notes,
});

const mapUserFromDb = (row: any): User => ({
  id: row.id,
  email: row.email,
  fullName: row.fullName,
  role: row.role,
  phone: row.phone,
  active: row.active,
});

export const DbProductStorage = {
  async getAll(): Promise<Product[]> {
    try {
      const data = await db.select().from(products).orderBy(desc(products.createdAt));
      return data.map(mapProductFromDb);
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  },

  async add(product: Product): Promise<boolean> {
    try {
      await db.insert(products).values({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        sku: product.sku,
        barcode: product.barcode || null,
        unit: product.unit,
        retailPrice: product.retailPrice.toString(),
        wholesalePrice: product.wholesalePrice.toString(),
        costPrice: product.costPrice.toString(),
        reorderLevel: product.reorderLevel,
        imageUrl: product.imageUrl || null,
        active: product.active,
      });
      return true;
    } catch (error) {
      console.error("Error adding product:", error);
      return false;
    }
  },

  async update(product: Product): Promise<boolean> {
    try {
      await db.update(products)
        .set({
          name: product.name,
          description: product.description,
          category: product.category,
          sku: product.sku,
          barcode: product.barcode || null,
          unit: product.unit,
          retailPrice: product.retailPrice.toString(),
          wholesalePrice: product.wholesalePrice.toString(),
          costPrice: product.costPrice.toString(),
          reorderLevel: product.reorderLevel,
          imageUrl: product.imageUrl || null,
          active: product.active,
        })
        .where(eq(products.id, product.id));
      return true;
    } catch (error) {
      console.error("Error updating product:", error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await db.delete(products).where(eq(products.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const data = await db.select().from(products).where(eq(products.id, id));
      if (data.length === 0) return null;
      return mapProductFromDb(data[0]);
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  },
};

export const DbBatchStorage = {
  async getAll(): Promise<InventoryBatch[]> {
    try {
      const data = await db.select().from(inventoryBatches).orderBy(desc(inventoryBatches.createdAt));
      return data.map(mapBatchFromDb);
    } catch (error) {
      console.error("Error fetching batches:", error);
      return [];
    }
  },

  async add(batch: InventoryBatch): Promise<boolean> {
    try {
      await db.insert(inventoryBatches).values({
        id: batch.id,
        productId: batch.productId,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        expiryDate: batch.expiryDate || null,
        supplierId: batch.supplierId || null,
        purchaseDate: batch.purchaseDate,
        costPerUnit: batch.costPerUnit.toString(),
      });
      return true;
    } catch (error) {
      console.error("Error adding batch:", error);
      return false;
    }
  },

  async update(batch: InventoryBatch): Promise<boolean> {
    try {
      await db.update(inventoryBatches)
        .set({
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          expiryDate: batch.expiryDate || null,
          supplierId: batch.supplierId || null,
          purchaseDate: batch.purchaseDate,
          costPerUnit: batch.costPerUnit.toString(),
        })
        .where(eq(inventoryBatches.id, batch.id));
      return true;
    } catch (error) {
      console.error("Error updating batch:", error);
      return false;
    }
  },

  async updateQuantity(batchId: string, quantity: number): Promise<boolean> {
    try {
      await db.update(inventoryBatches)
        .set({ quantity })
        .where(eq(inventoryBatches.id, batchId));
      return true;
    } catch (error) {
      console.error("Error updating batch quantity:", error);
      return false;
    }
  },

  async getByProductId(productId: string): Promise<InventoryBatch[]> {
    try {
      const data = await db.select().from(inventoryBatches).where(eq(inventoryBatches.productId, productId));
      return data.map(mapBatchFromDb);
    } catch (error) {
      console.error("Error fetching batches by product:", error);
      return [];
    }
  },
};

export const DbCustomerStorage = {
  async getAll(): Promise<Customer[]> {
    try {
      const data = await db.select().from(customers).orderBy(desc(customers.createdAt));
      return data.map(mapCustomerFromDb);
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  },

  async add(customer: Customer): Promise<boolean> {
    try {
      await db.insert(customers).values({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        address: customer.address || null,
        customerType: customer.customerType,
        creditLimit: customer.creditLimit.toString(),
        currentBalance: customer.currentBalance.toString(),
        loyaltyPoints: customer.loyaltyPoints,
      });
      return true;
    } catch (error) {
      console.error("Error adding customer:", error);
      return false;
    }
  },

  async update(customer: Customer): Promise<boolean> {
    try {
      await db.update(customers)
        .set({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
          address: customer.address || null,
          customerType: customer.customerType,
          creditLimit: customer.creditLimit.toString(),
          currentBalance: customer.currentBalance.toString(),
          loyaltyPoints: customer.loyaltyPoints,
        })
        .where(eq(customers.id, customer.id));
      return true;
    } catch (error) {
      console.error("Error updating customer:", error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await db.delete(customers).where(eq(customers.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      return false;
    }
  },
};

export const DbSupplierStorage = {
  async getAll(): Promise<Supplier[]> {
    try {
      const data = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
      return data.map(mapSupplierFromDb);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      return [];
    }
  },

  async add(supplier: Supplier): Promise<boolean> {
    try {
      await db.insert(suppliers).values({
        id: supplier.id,
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email || null,
        address: supplier.address || null,
        paymentTerms: supplier.paymentTerms || null,
        active: supplier.active,
      });
      return true;
    } catch (error) {
      console.error("Error adding supplier:", error);
      return false;
    }
  },

  async update(supplier: Supplier): Promise<boolean> {
    try {
      await db.update(suppliers)
        .set({
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email || null,
          address: supplier.address || null,
          paymentTerms: supplier.paymentTerms || null,
          active: supplier.active,
        })
        .where(eq(suppliers.id, supplier.id));
      return true;
    } catch (error) {
      console.error("Error updating supplier:", error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await db.delete(suppliers).where(eq(suppliers.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting supplier:", error);
      return false;
    }
  },
};

export const DbTransactionStorage = {
  async getAll(): Promise<Transaction[]> {
    try {
      const txData = await db.select().from(transactions).orderBy(desc(transactions.transactionDate));
      const itemsData = await db.select().from(transactionItems);
      
      const itemsMap = new Map<string, TransactionItem[]>();
      itemsData.forEach((item: any) => {
        const txId = item.transactionId;
        if (!itemsMap.has(txId)) {
          itemsMap.set(txId, []);
        }
        itemsMap.get(txId)!.push({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice || "0"),
          discount: parseFloat(item.discount || "0"),
          total: parseFloat(item.total || "0"),
        });
      });

      return txData.map((tx: any) => mapTransactionFromDb(tx, itemsMap.get(tx.id) || []));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  },

  async add(transaction: Transaction): Promise<boolean> {
    try {
      await db.insert(transactions).values({
        id: transaction.id,
        transactionNumber: transaction.transactionNumber,
        customerId: transaction.customerId || null,
        customerName: transaction.customerName || null,
        userId: transaction.userId,
        transactionDate: transaction.transactionDate ? new Date(transaction.transactionDate) : new Date(),
        subtotal: transaction.subtotal.toString(),
        discount: transaction.discount.toString(),
        tax: transaction.tax.toString(),
        total: transaction.total.toString(),
        paymentMethod: transaction.paymentMethod,
        paymentStatus: transaction.paymentStatus,
        referenceNumber: transaction.referenceNumber || null,
        notes: transaction.notes || null,
      });

      if (transaction.items.length > 0) {
        const itemsToInsert = transaction.items.map(item => ({
          id: item.id,
          transactionId: transaction.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          discount: item.discount.toString(),
          total: item.total.toString(),
        }));
        
        await db.insert(transactionItems).values(itemsToInsert);
      }

      return true;
    } catch (error) {
      console.error("Error adding transaction:", error);
      return false;
    }
  },

  async getById(id: string): Promise<Transaction | null> {
    try {
      const txData = await db.select().from(transactions).where(eq(transactions.id, id));
      if (txData.length === 0) return null;

      const itemsData = await db.select().from(transactionItems).where(eq(transactionItems.transactionId, id));
      
      const mappedItems: TransactionItem[] = itemsData.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice || "0"),
        discount: parseFloat(item.discount || "0"),
        total: parseFloat(item.total || "0"),
      }));

      return mapTransactionFromDb(txData[0], mappedItems);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return null;
    }
  },
};

export const DbUserStorage = {
  async getByEmail(email: string): Promise<User | null> {
    try {
      const data = await db.select().from(users).where(eq(users.email, email));
      if (data.length === 0) return null;
      return mapUserFromDb(data[0]);
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  },

  async create(user: User): Promise<boolean> {
    try {
      await db.insert(users).values({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone || null,
        active: user.active,
      });
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      return false;
    }
  },
};
