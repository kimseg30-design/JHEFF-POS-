'use client';

import { BaseService } from './base-service';
import { Branch, STORES } from '@/lib/db/idb';

class BranchService extends BaseService<Branch> {
  constructor() {
    super(STORES.BRANCHES);
  }

  async getByBusiness(businessId: string): Promise<Branch[]> {
    return this.query(b => b.businessId === businessId);
  }
}

export const branchService = new BranchService();
