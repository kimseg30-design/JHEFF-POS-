'use client';

import { BaseService } from './base-service';
import { StoreInfo, STORES } from '@/lib/db/idb';

class StoreService extends BaseService<StoreInfo> {
  constructor() {
    super(STORES.STORE_INFO);
  }

  async getStore(): Promise<StoreInfo | undefined> {
    const stores = await this.getAll();
    return stores[0];
  }
}

export const storeService = new StoreService();
