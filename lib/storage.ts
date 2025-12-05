import { db } from "@/server/db";
import { products, inventoryBatches, customers, suppliers, transactions, transactionItems, users } from "@/server/schema";
import { Product, Customer, Supplier, Transaction, InventoryBatch, User, TransactionItem } from "@/types";
import { eq, desc } from "drizzle-orm";

export const ProductStorage = {
  async getAll(): Promise<Product[]> {
    try {
      const result = await db.select().from(products).orderBy(desc(products.createdAt));
      return result.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description || "",
        category: row.category as any,
        sku: row.sku,
        barcode: row.barcode || undefined,
        unit: row.unit as any,
        retailPrice: parseFloat(row.retailPrice),
        wholesalePrice: parseFloat(row.wholesalePrice),
        costPrice: parseFloat(row.costPrice),
        reorderLevel: row.reorderLevel,
        imageUrl: row.imageUrl || undefined,
        active: row.active,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }));
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
        description: product.description || null,
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
      await db.update(products).set({
        name: product.name,
        description: product.description || null,
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
        updatedAt: new Date(),
      }).where(eq(products.id, product.id));
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
      const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (result.length === 0) return null;
      
      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description || "",
        category: row.category as any,
        sku: row.sku,
        barcode: row.barcode || undefined,
        unit: row.unit as any,
        retailPrice: parseFloat(row.retailPrice),
        wholesalePrice: parseFloat(row.wholesalePrice),
        costPrice: parseFloat(row.costPrice),
        reorderLevel: row.reorderLevel,
        imageUrl: row.imageUrl || undefined,
        active: row.active,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error("Error fetching product by id:", error);
      return null;
    }
  },
};

export const BatchStorage = {
  async getAll(): Promise<InventoryBatch[]> {
    try {
      const result = await db.select().from(inventoryBatches).orderBy(desc(inventoryBatches.createdAt));
      return result.map((row) => ({
        id: row.id,
        productId: row.productId,
        batchNumber: row.batchNumber,
        quantity: row.quantity,
        expiryDate: row.expiryDate || undefined,
        supplierId: row.supplierId || undefined,
        purchaseDate: row.purchaseDate,
        costPerUnit: parseFloat(row.costPerUnit),
      }));
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
      await db.update(inventoryBatches).set({
        productId: batch.productId,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        expiryDate: batch.expiryDate || null,
        supplierId: batch.supplierId || null,
        purchaseDate: batch.purchaseDate,
        costPerUnit: batch.costPerUnit.toString(),
      }).where(eq(inventoryBatches.id, batch.id));
      return true;
    } catch (error) {
      console.error("Error updating batch:", error);
      return false;
    }
  },

  async updateQuantity(batchId: string, quantity: number): Promise<boolean> {
    try {
      await db.update(inventoryBatches).set({ quantity }).where(eq(inventoryBatches.id, batchId));
      return true;
    } catch (error) {
      console.error("Error updating batch quantity:", error);
      return false;
    }
  },

  async getByProductId(productId: string): Promise<InventoryBatch[]> {
    try {
      const result = await db.select().from(inventoryBatches).where(eq(inventoryBatches.productId, productId));
      return result.map((row) => ({
        id: row.id,
        productId: row.productId,
        batchNumber: row.batchNumber,
        quantity: row.quantity,
        expiryDate: row.expiryDate || undefined,
        supplierId: row.supplierId || undefined,
        purchaseDate: row.purchaseDate,
        costPerUnit: parseFloat(row.costPerUnit),
      }));
    } catch (error) {
      console.error("Error fetching batches by product:", error);
      return [];
    }
  },
};

export const CustomerStorage = {
  async getAll(): Promise<Customer[]> {
    try {
      const result = await db.select().from(customers).orderBy(desc(customers.createdAt));
      return result.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email || undefined,
        address: row.address || undefined,
        customerType: row.customerType as any,
        creditLimit: parseFloat(row.creditLimit),
        currentBalance: parseFloat(row.currentBalance),
        loyaltyPoints: row.loyaltyPoints,
      }));
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
      await db.update(customers).set({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        address: customer.address || null,
        customerType: customer.customerType,
        creditLimit: customer.creditLimit.toString(),
        currentBalance: customer.currentBalance.toString(),
        loyaltyPoints: customer.loyaltyPoints,
      }).where(eq(customers.id, customer.id));
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

export const SupplierStorage = {
  async getAll(): Promise<Supplier[]> {
    try {
      const result = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
      return result.map((row) => ({
        id: row.id,
        name: row.name,
        contactPerson: row.contactPerson,
        phone: row.phone,
        email: row.email || undefined,
        address: row.address || undefined,
        paymentTerms: row.paymentTerms || undefined,
        active: row.active,
      }));
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
      await db.update(suppliers).set({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email || null,
        address: supplier.address || null,
        paymentTerms: supplier.paymentTerms || null,
        active: supplier.active,
      }).where(eq(suppliers.id, supplier.id));
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

export const TransactionStorage = {
  async getAll(): Promise<Transaction[]> {
    try {
      const txResult = await db.select().from(transactions).orderBy(desc(transactions.transactionDate));
      const itemsResult = await db.select().from(transactionItems);
      
      const itemsMap = new Map<string, TransactionItem[]>();
      itemsResult.forEach((item) => {
        const txId = item.transactionId;
        if (!itemsMap.has(txId)) {
          itemsMap.set(txId, []);
        }
        itemsMap.get(txId)!.push({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          discount: parseFloat(item.discount),
          total: parseFloat(item.total),
        });
      });

      return txResult.map((tx) => ({
        id: tx.id,
        transactionNumber: tx.transactionNumber,
        customerId: tx.customerId || undefined,
        customerName: tx.customerName || undefined,
        userId: tx.userId,
        transactionDate: tx.transactionDate.toISOString(),
        items: itemsMap.get(tx.id) || [],
        subtotal: parseFloat(tx.subtotal),
        discount: parseFloat(tx.discount),
        tax: parseFloat(tx.tax),
        total: parseFloat(tx.total),
        paymentMethod: tx.paymentMethod as any,
        paymentStatus: tx.paymentStatus as any,
        referenceNumber: tx.referenceNumber || undefined,
        notes: tx.notes || undefined,
      }));
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
        transactionDate: new Date(transaction.transactionDate),
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
        await db.insert(transactionItems).values(
          transaction.items.map((item) => ({
            id: item.id,
            transactionId: transaction.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            discount: item.discount.toString(),
            total: item.total.toString(),
          }))
        );
      }

      return true;
    } catch (error) {
      console.error("Error adding transaction:", error);
      return false;
    }
  },

  async getById(id: string): Promise<Transaction | null> {
    try {
      const txResult = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
      if (txResult.length === 0) return null;

      const tx = txResult[0];
      const itemsResult = await db.select().from(transactionItems).where(eq(transactionItems.transactionId, id));

      const items: TransactionItem[] = itemsResult.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        discount: parseFloat(item.discount),
        total: parseFloat(item.total),
      }));

      return {
        id: tx.id,
        transactionNumber: tx.transactionNumber,
        customerId: tx.customerId || undefined,
        customerName: tx.customerName || undefined,
        userId: tx.userId,
        transactionDate: tx.transactionDate.toISOString(),
        items,
        subtotal: parseFloat(tx.subtotal),
        discount: parseFloat(tx.discount),
        tax: parseFloat(tx.tax),
        total: parseFloat(tx.total),
        paymentMethod: tx.paymentMethod as any,
        paymentStatus: tx.paymentStatus as any,
        referenceNumber: tx.referenceNumber || undefined,
        notes: tx.notes || undefined,
      };
    } catch (error) {
      console.error("Error fetching transaction by id:", error);
      return null;
    }
  },
};

export const UserStorage = {
  async getByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (result.length === 0) return null;
      
      const row = result[0];
      return {
        id: row.id,
        email: row.email,
        fullName: row.fullName,
        role: row.role as any,
        phone: row.phone || undefined,
        active: row.active,
      };
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  },

  async create(user: User): Promise<boolean> {
    try {
      await db.insert(users).values({
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
