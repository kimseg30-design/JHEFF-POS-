'use client';

import { BaseService } from './base-service';
import { EWalletTransaction, STORES } from '@/lib/db/idb';

class EWalletService extends BaseService<EWalletTransaction> {
  constructor() {
    super(STORES.EWALLET_TRANSACTIONS);
  }

  async getByBranch(branchId: string): Promise<EWalletTransaction[]> {
    return this.query(t => t.branchId === branchId);
  }
}

export const ewalletService = new EWalletService();
