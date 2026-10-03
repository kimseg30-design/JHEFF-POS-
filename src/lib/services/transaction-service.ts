'use client';

import { BaseService } from './base-service';
import { Transaction, STORES } from '@/lib/db/idb';

class TransactionService extends BaseService<Transaction> {
  constructor() {
    super(STORES.TRANSACTIONS);
  }

  async getByBranch(branchId: string): Promise<Transaction[]> {
    return this.query(t => t.branchId === branchId);
  }

  async getByCustomer(customerId: string): Promise<Transaction[]> {
    return this.query(t => t.customerId === customerId);
  }
}

export const transactionService = new TransactionService();
