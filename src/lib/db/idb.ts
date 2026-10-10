export type StoreInfo = {
  id: string;
  name: string;
  address?: string; // Added for business info
  tin?: string; // Added for BIR compliance
  currency: string;
  taxType: 'VAT' | 'NON-VAT';
  vatRate: number;
  lastORNumber: number; // Added for sequential OR numbering
  lastSyncedAt?: number; // Last successful full sync with cloud
  updatedAt: number;
  isDeleted?: boolean;
};

export type Branch = {
  id: string;
  name: string;
  businessId: string; // Reference to StoreInfo
  address?: string;
  contact?: string;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
};

export type Product = {
  id: string; // UUID for SaaS sync
  name: string;
  price: number;
  cost: number; // Added for profit tracking
  stock: number;
  minStock?: number; // Optional custom low stock threshold
  category: string;
  branchId: string; // Reference to Branch
  barcode?: string;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
};

export type TransactionItem = {
  productId: string;
  name: string;
  price: number;
  costPrice: number; // Added for profit tracking (cost at time of sale)
  quantity: number;
};

export type Transaction = {
  id: string;
  ticketNumber: string; // Sequential ticket number (e.g., T-0001)
  orNumber: string; // Added for Official Receipt numbering
  items: TransactionItem[];
  total: number;
  vatableSales?: number;
  vatAmount?: number;
  taxType?: 'VAT' | 'NON-VAT';
  timestamp: number;
  branchId: string; // Reference to Branch
  customerId?: string; // UUID
  customerName?: string;
  paymentMethod: 'cash' | 'gcash' | 'bank_transfer' | 'credit' | 'utang' | 'split' | string;
  amountPaid?: number;
  change?: number;
  paymentDetails?: {
    referenceNumber?: string;
    bankName?: string;
    splitBreakdown?: {
      method: string;
      amount: number;
      reference?: string;
      customerId?: string;
      customerName?: string;
    }[];
    notes?: string;
  };
  updatedAt: number;
  isDeleted?: boolean;
};

export type Customer = {
  id: string;
  name: string;
  contact: string;
  totalUtang: number;
  branchId: string; // Reference to Branch
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
};

export type CreditEntry = {
  id: string;
  customerId: string;
  branchId: string; // Reference to Branch
  amount: number; // Positive for utang, negative for payment
  type: 'credit' | 'payment';
  description: string;
  timestamp: number;
  updatedAt: number;
  isDeleted?: boolean;
  targetCreditId?: string; // Optional: specify target credit ID if targeted payment
};

export type SyncAction = {
  id?: number; // Local queue ID can stay numeric for ordering
  store: StoreName;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'failed';
  retryCount: number;
};

export type EWalletTransaction = {
  id: string;
  orNumber?: string; // Added for BIR compliance
  type: 'cash_in' | 'cash_out';
  amount: number;
  method: 'gcash' | 'maya' | 'bank_transfer' | 'gotyme';
  fee?: number;
  customerName?: string;
  referenceNumber?: string;
  branchId: string;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
};

export type Supplier = {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  branchId: string;
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
};

export type RestockItem = {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
};

export type RestockTransaction = {
  id: string;
  supplierId: string;
  items: RestockItem[];
  totalCost: number;
  timestamp: number;
  branchId: string;
  referenceNumber?: string;
  notes?: string;
  updatedAt: number;
  isDeleted?: boolean;
};

export type AuditLog = {
  id: string;
  action: string;
  user?: string;
  details: string;
  timestamp: number;
  updatedAt: number;
  isDeleted?: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'cashier';
  businessId: string; // Reference to StoreInfo
  assignedBranchIds: string[]; // Branches this user can access
  createdAt: number;
  updatedAt: number;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: 'Utilities' | 'Rent' | 'Salary' | 'Inventory Restock' | 'Snacks / Refreshments' | 'Marketing' | 'Others';
  timestamp: number;
  branchId: string;
  createdBy: string;
  referenceNumber?: string;
  isDeleted?: boolean;
  updatedAt: number;
};

const DB_NAME = 'SariSariPOS_DB';
const DB_VERSION = 16; // Incremented for Expense store additions

export const STORES = {
  STORE_INFO: 'store_info',
  BRANCHES: 'branches',
  PRODUCTS: 'products',
  TRANSACTIONS: 'transactions',
  CUSTOMERS: 'customers',
  CREDIT_LOG: 'credit_log',
  SYNC_QUEUE: 'sync_queue',
  METADATA: 'metadata',
  EWALLET_TRANSACTIONS: 'ewallet_transactions',
  SUPPLIERS: 'suppliers',
  RESTOCK_TRANSACTIONS: 'restock_transactions',
  AUDIT_LOGS: 'audit_logs',
  USERS: 'users',
  EXPENSES: 'expenses',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

class IndexedDBUtility {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Helper to create or recreate stores
        const ensureStore = (name: string, options: IDBObjectStoreParameters) => {
          if (db.objectStoreNames.contains(name)) {
            db.deleteObjectStore(name);
          }
          db.createObjectStore(name, options);
        };

        ensureStore(STORES.STORE_INFO, { keyPath: 'id' });
        ensureStore(STORES.BRANCHES, { keyPath: 'id' });
        ensureStore(STORES.PRODUCTS, { keyPath: 'id' });
        ensureStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        ensureStore(STORES.CUSTOMERS, { keyPath: 'id' });
        ensureStore(STORES.CREDIT_LOG, { keyPath: 'id' });
        ensureStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        ensureStore(STORES.METADATA, { keyPath: 'key' });
        ensureStore(STORES.EWALLET_TRANSACTIONS, { keyPath: 'id' });
        ensureStore(STORES.SUPPLIERS, { keyPath: 'id' });
        ensureStore(STORES.RESTOCK_TRANSACTIONS, { keyPath: 'id' });
        ensureStore(STORES.AUDIT_LOGS, { keyPath: 'id' });
        ensureStore(STORES.USERS, { keyPath: 'id' });
        ensureStore(STORES.EXPENSES, { keyPath: 'id' });
      };
    });
  }

  async addItem<T>(storeName: StoreName, item: T): Promise<number | string> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result as number | string);
      request.onerror = () => reject(request.error);
    });
  }

  async getItems<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async getItemById<T>(storeName: StoreName, id: number | string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  async updateItem<T>(storeName: StoreName, item: T): Promise<number | string> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result as number | string);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteItem(storeName: StoreName, id: number | string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName: StoreName): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbUtil = new IndexedDBUtility();
