import { supabase } from "./supabase";
import { Product, Customer, Supplier, Transaction, InventoryBatch, User, TransactionItem } from "@/types";

const mapProductFromDb = (row: any): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  sku: row.sku,
  barcode: row.barcode,
  unit: row.unit,
  retailPrice: row.retail_price,
  wholesalePrice: row.wholesale_price,
  costPrice: row.cost_price,
  reorderLevel: row.reorder_level,
  imageUrl: row.image_url,
  active: row.active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapProductToDb = (product: Partial<Product>) => ({
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
});

const mapBatchFromDb = (row: any): InventoryBatch => ({
  id: row.id,
  productId: row.product_id,
  batchNumber: row.batch_number,
  quantity: row.quantity,
  expiryDate: row.expiry_date,
  supplierId: row.supplier_id,
  purchaseDate: row.purchase_date,
  costPerUnit: row.cost_per_unit,
});

const mapBatchToDb = (batch: Partial<InventoryBatch>) => ({
  id: batch.id,
  product_id: batch.productId,
  batch_number: batch.batchNumber,
  quantity: batch.quantity,
  expiry_date: batch.expiryDate || null,
  supplier_id: batch.supplierId || null,
  purchase_date: batch.purchaseDate,
  cost_per_unit: batch.costPerUnit,
});

const mapCustomerFromDb = (row: any): Customer => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  address: row.address,
  customerType: row.customer_type,
  creditLimit: row.credit_limit,
  currentBalance: row.current_balance,
  loyaltyPoints: row.loyalty_points,
});

const mapCustomerToDb = (customer: Partial<Customer>) => ({
  id: customer.id,
  name: customer.name,
  phone: customer.phone,
  email: customer.email || null,
  address: customer.address || null,
  customer_type: customer.customerType,
  credit_limit: customer.creditLimit,
  current_balance: customer.currentBalance,
  loyalty_points: customer.loyaltyPoints,
});

const mapSupplierFromDb = (row: any): Supplier => ({
  id: row.id,
  name: row.name,
  contactPerson: row.contact_person,
  phone: row.phone,
  email: row.email,
  address: row.address,
  paymentTerms: row.payment_terms,
  active: row.active,
});

const mapSupplierToDb = (supplier: Partial<Supplier>) => ({
  id: supplier.id,
  name: supplier.name,
  contact_person: supplier.contactPerson,
  phone: supplier.phone,
  email: supplier.email || null,
  address: supplier.address || null,
  payment_terms: supplier.paymentTerms || null,
  active: supplier.active,
});

const mapTransactionFromDb = (row: any, items: TransactionItem[]): Transaction => ({
  id: row.id,
  transactionNumber: row.transaction_number,
  customerId: row.customer_id,
  customerName: row.customer_name,
  userId: row.user_id,
  transactionDate: row.transaction_date,
  items: items,
  subtotal: row.subtotal,
  discount: row.discount,
  tax: row.tax,
  total: row.total,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  referenceNumber: row.reference_number,
  notes: row.notes,
});

const mapTransactionToDb = (transaction: Partial<Transaction>) => ({
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
});

const mapTransactionItemToDb = (item: TransactionItem, transactionId: string) => ({
  id: item.id,
  transaction_id: transactionId,
  product_id: item.productId,
  product_name: item.productName,
  quantity: item.quantity,
  unit_price: item.unitPrice,
  discount: item.discount,
  total: item.total,
});

const mapUserFromDb = (row: any): User => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  phone: row.phone,
  active: row.active,
});

export const SupabaseProductStorage = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }
    return (data || []).map(mapProductFromDb);
  },

  async add(product: Product): Promise<boolean> {
    const { error } = await supabase
      .from("products")
      .insert(mapProductToDb(product));
    
    if (error) {
      console.error("Error adding product:", error);
      return false;
    }
    return true;
  },

  async update(product: Product): Promise<boolean> {
    const { error } = await supabase
      .from("products")
      .update(mapProductToDb(product))
      .eq("id", product.id);
    
    if (error) {
      console.error("Error updating product:", error);
      return false;
    }
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting product:", error);
      return false;
    }
    return true;
  },

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) return null;
    return mapProductFromDb(data);
  },
};

export const SupabaseBatchStorage = {
  async getAll(): Promise<InventoryBatch[]> {
    const { data, error } = await supabase
      .from("inventory_batches")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching batches:", error);
      return [];
    }
    return (data || []).map(mapBatchFromDb);
  },

  async add(batch: InventoryBatch): Promise<boolean> {
    const { error } = await supabase
      .from("inventory_batches")
      .insert(mapBatchToDb(batch));
    
    if (error) {
      console.error("Error adding batch:", error);
      return false;
    }
    return true;
  },

  async update(batch: InventoryBatch): Promise<boolean> {
    const { error } = await supabase
      .from("inventory_batches")
      .update(mapBatchToDb(batch))
      .eq("id", batch.id);
    
    if (error) {
      console.error("Error updating batch:", error);
      return false;
    }
    return true;
  },

  async updateQuantity(batchId: string, quantity: number): Promise<boolean> {
    const { error } = await supabase
      .from("inventory_batches")
      .update({ quantity })
      .eq("id", batchId);
    
    if (error) {
      console.error("Error updating batch quantity:", error);
      return false;
    }
    return true;
  },

  async getByProductId(productId: string): Promise<InventoryBatch[]> {
    const { data, error } = await supabase
      .from("inventory_batches")
      .select("*")
      .eq("product_id", productId);
    
    if (error) {
      console.error("Error fetching batches by product:", error);
      return [];
    }
    return (data || []).map(mapBatchFromDb);
  },
};

export const SupabaseCustomerStorage = {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
    return (data || []).map(mapCustomerFromDb);
  },

  async add(customer: Customer): Promise<boolean> {
    const { error } = await supabase
      .from("customers")
      .insert(mapCustomerToDb(customer));
    
    if (error) {
      console.error("Error adding customer:", error);
      return false;
    }
    return true;
  },

  async update(customer: Customer): Promise<boolean> {
    const { error } = await supabase
      .from("customers")
      .update(mapCustomerToDb(customer))
      .eq("id", customer.id);
    
    if (error) {
      console.error("Error updating customer:", error);
      return false;
    }
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting customer:", error);
      return false;
    }
    return true;
  },
};

export const SupabaseSupplierStorage = {
  async getAll(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching suppliers:", error);
      return [];
    }
    return (data || []).map(mapSupplierFromDb);
  },

  async add(supplier: Supplier): Promise<boolean> {
    const { error } = await supabase
      .from("suppliers")
      .insert(mapSupplierToDb(supplier));
    
    if (error) {
      console.error("Error adding supplier:", error);
      return false;
    }
    return true;
  },

  async update(supplier: Supplier): Promise<boolean> {
    const { error } = await supabase
      .from("suppliers")
      .update(mapSupplierToDb(supplier))
      .eq("id", supplier.id);
    
    if (error) {
      console.error("Error updating supplier:", error);
      return false;
    }
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting supplier:", error);
      return false;
    }
    return true;
  },
};

export const SupabaseTransactionStorage = {
  async getAll(): Promise<Transaction[]> {
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: false });
    
    if (txError) {
      console.error("Error fetching transactions:", txError);
      return [];
    }

    const { data: items, error: itemsError } = await supabase
      .from("transaction_items")
      .select("*");
    
    if (itemsError) {
      console.error("Error fetching transaction items:", itemsError);
      return [];
    }

    const itemsMap = new Map<string, TransactionItem[]>();
    (items || []).forEach((item: any) => {
      const txId = item.transaction_id;
      if (!itemsMap.has(txId)) {
        itemsMap.set(txId, []);
      }
      itemsMap.get(txId)!.push({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        discount: item.discount,
        total: item.total,
      });
    });

    return (transactions || []).map((tx: any) => 
      mapTransactionFromDb(tx, itemsMap.get(tx.id) || [])
    );
  },

  async add(transaction: Transaction): Promise<boolean> {
    const { error: txError } = await supabase
      .from("transactions")
      .insert(mapTransactionToDb(transaction));
    
    if (txError) {
      console.error("Error adding transaction:", txError);
      return false;
    }

    if (transaction.items.length > 0) {
      const itemsToInsert = transaction.items.map(item => 
        mapTransactionItemToDb(item, transaction.id)
      );
      
      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(itemsToInsert);
      
      if (itemsError) {
        console.error("Error adding transaction items:", itemsError);
        return false;
      }
    }

    return true;
  },

  async getById(id: string): Promise<Transaction | null> {
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();
    
    if (txError || !tx) return null;

    const { data: items, error: itemsError } = await supabase
      .from("transaction_items")
      .select("*")
      .eq("transaction_id", id);
    
    if (itemsError) return null;

    const mappedItems: TransactionItem[] = (items || []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discount: item.discount,
      total: item.total,
    }));

    return mapTransactionFromDb(tx, mappedItems);
  },
};

export const SupabaseUserStorage = {
  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    
    if (error || !data) return null;
    return mapUserFromDb(data);
  },

  async create(user: User): Promise<boolean> {
    const { error } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        phone: user.phone || null,
        active: user.active,
      });
    
    if (error) {
      console.error("Error creating user:", error);
      return false;
    }
    return true;
  },
};
