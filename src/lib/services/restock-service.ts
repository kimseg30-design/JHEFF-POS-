'use client';

import { BaseService } from './base-service';
import { Supplier, RestockTransaction, STORES, dbUtil } from '@/lib/db/idb';
import { syncDb } from '@/lib/db/sync-queue';

class RestockService extends BaseService<RestockTransaction> {
  constructor() {
    super(STORES.RESTOCK_TRANSACTIONS);
  }

  async getByBranch(branchId: string): Promise<RestockTransaction[]> {
    return this.query(t => t.branchId === branchId);
  }

  async getSuppliersByBranch(branchId: string): Promise<Supplier[]> {
    const all = await dbUtil.getItems<Supplier>(STORES.SUPPLIERS);
    return all.filter(s => s.branchId === branchId && !s.isDeleted);
  }

  async createSupplier(supplier: Omit<Supplier, 'updatedAt' | 'isDeleted'>): Promise<string> {
    const now = Date.now();
    const newSupplier = {
      ...supplier,
      updatedAt: now,
      isDeleted: false,
    } as Supplier;
    
    return await syncDb.add(STORES.SUPPLIERS, newSupplier);
  }

  async updateSupplier(supplier: Supplier): Promise<string> {
    return await syncDb.update(STORES.SUPPLIERS, { ...supplier, updatedAt: Date.now() });
  }

  async deleteSupplier(id: string): Promise<void> {
    await syncDb.delete(STORES.SUPPLIERS, id);
  }
}

export const restockService = new RestockService();
