'use client';

import { BaseService } from './base-service';
import { Customer, CreditEntry, STORES, dbUtil } from '@/lib/db/idb';
import { syncDb } from '@/lib/db/sync-queue';

class CustomerService extends BaseService<Customer> {
  constructor() {
    super(STORES.CUSTOMERS);
  }

  async getByBranch(branchId: string): Promise<Customer[]> {
    return this.query(c => c.branchId === branchId);
  }

  async getCreditHistory(customerId: string): Promise<CreditEntry[]> {
    const all = await dbUtil.getItems<CreditEntry>(STORES.CREDIT_LOG);
    return all.filter(e => e.customerId === customerId && !e.isDeleted);
  }

  async recordCredit(entry: Omit<CreditEntry, 'updatedAt' | 'isDeleted'>): Promise<void> {
    const now = Date.now();
    const newEntry = {
      ...entry,
      updatedAt: now,
      isDeleted: false,
    } as CreditEntry;
    
    await syncDb.add(STORES.CREDIT_LOG, newEntry);
  }
}

export const customerService = new CustomerService();
