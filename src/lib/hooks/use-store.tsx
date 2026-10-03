'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreInfo, Product, Branch } from '@/lib/db/idb';
import { storeService } from '@/lib/services/store-service';
import { productService } from '@/lib/services/product-service';
import { branchService } from '@/lib/services/branch-service';
import { auditService } from '@/lib/services/audit-service';
import { pullSync, processQueue } from '@/lib/db/sync-queue';

const CURRENT_BRANCH_KEY = 'sarisari_current_branch_id';

interface StoreContextType {
  store: StoreInfo | null;
  loading: boolean;
  updateStore: (name: string, address?: string, tin?: string, taxType?: 'VAT' | 'NON-VAT', vatRate?: number) => Promise<void>;
  getNextORNumber: () => Promise<string>;
  products: Product[];
  allProducts: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => Promise<Product>;
  branches: Branch[];
  currentBranchId: string | null;
  currentBranch: Branch | undefined;
  addBranch: (branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt' | 'businessId' | 'isDeleted'>) => Promise<Branch>;
  updateBranch: (branch: Branch) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  switchBranch: (branchId: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStore = async (isBackgroundSync = false) => {
    try {
      const currentStore = await storeService.getStore();
      if (currentStore) {
        setStore(currentStore);
      }

      // Load Branches
      const businessId = currentStore?.id || 'main_config';
      let activeBranches = await branchService.getByBusiness(businessId);
      
      // Auto-create Main Branch if none exists
      if (activeBranches.length === 0) {
        const id = crypto.randomUUID();
        const now = Date.now();
        const mainBranch: Branch = {
          id,
          name: 'Main Branch',
          address: currentStore?.address || 'Main Address',
          businessId,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };
        await branchService.create(mainBranch);
        activeBranches = [mainBranch];
        await auditService.log('BRANCH_AUTO_CREATE', JSON.stringify({ name: 'Main Branch', id }));
      }

      setBranches(activeBranches.sort((a, b) => b.createdAt - a.createdAt));

      // Initialize current branch
      const savedId = localStorage.getItem(CURRENT_BRANCH_KEY);
      if (activeBranches.length > 0) {
        if (!savedId || !activeBranches.find(b => b.id === savedId)) {
          const defaultId = activeBranches[0].id;
          setCurrentBranchId(defaultId);
          localStorage.setItem(CURRENT_BRANCH_KEY, defaultId);
        } else {
          setCurrentBranchId(savedId);
        }
      }

      const allProducts = await productService.getAll();
      setProducts(allProducts.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load store info:', error);
    } finally {
      if (!isBackgroundSync) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // 1. Instant local load
    loadStore();

    // 2. Non-blocking background sync with cloud
    if (typeof window !== 'undefined' && window.navigator.onLine) {
      (async () => {
        try {
          await pullSync();
          await processQueue();
          await loadStore(true);
        } catch (syncError) {
          console.warn('[CloudSync] Background startup sync bypassed:', syncError);
        }
      })();
    }
  }, []);

  const addBranch = async (branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt' | 'businessId' | 'isDeleted'>) => {
    const businessId = store?.id || 'main_config';
    const id = crypto.randomUUID();
    const now = Date.now();
    const newBranch: Branch = {
      ...branch,
      id,
      businessId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    await branchService.create(newBranch);
    await auditService.log('BRANCH_ADD', JSON.stringify({ name: branch.name, id }));
    await loadStore();
    return newBranch;
  };

  const updateBranch = async (branch: Branch) => {
    await branchService.update(branch);
    await auditService.log('BRANCH_UPDATE', JSON.stringify({ name: branch.name, id: branch.id }));
    await loadStore();
  };

  const deleteBranch = async (id: string) => {
    await branchService.delete(id);
    await auditService.log('BRANCH_DELETE', JSON.stringify({ id }));
    await loadStore();
  };

  const switchBranch = (branchId: string) => {
    setCurrentBranchId(branchId);
    localStorage.setItem(CURRENT_BRANCH_KEY, branchId);
  };

  const currentBranch = branches.find(b => b.id === currentBranchId);

  const filteredProducts = products.filter(p => p.branchId === currentBranchId);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    await productService.create(newProduct);
    await auditService.log('PRODUCT_ADD', JSON.stringify({ name: product.name, id }));
    await loadStore();
    return newProduct;
  };

  const updateStore = async (name: string, address: string = '', tin: string = '', taxType: 'VAT' | 'NON-VAT' = 'NON-VAT', vatRate: number = 12) => {
    const currentStore = await storeService.getById('main_config');
    const newStore: StoreInfo = {
      id: 'main_config',
      name,
      address,
      tin,
      currency: 'PHP',
      taxType,
      vatRate,
      lastORNumber: currentStore?.lastORNumber || 0,
      updatedAt: Date.now(),
    };
    await storeService.update(newStore);
    await auditService.log('STORE_SETTINGS_UPDATE', JSON.stringify({ name, taxType, tin }));
    await loadStore();
  };

  const getNextORNumber = async () => {
    const currentStore = store || (await storeService.getById('main_config'));
    const nextNum = (currentStore?.lastORNumber || 0) + 1;
    
    const updatedStore: StoreInfo = {
      ...(currentStore || {
        id: 'main_config',
        name: 'My Store',
        currency: 'PHP',
        taxType: 'NON-VAT',
        vatRate: 12,
      }),
      lastORNumber: nextNum,
      updatedAt: Date.now(),
    };
    
    await storeService.update(updatedStore);
    await loadStore();
    
    return `OR-${nextNum.toString().padStart(6, '0')}`;
  };

  return (
    <StoreContext.Provider value={{ 
      store, 
      loading, 
      updateStore, 
      getNextORNumber, 
      products: filteredProducts, 
      allProducts: products,
      addProduct,
      branches,
      currentBranchId,
      currentBranch,
      addBranch,
      updateBranch,
      deleteBranch,
      switchBranch
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
