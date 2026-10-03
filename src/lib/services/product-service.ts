'use client';

import { BaseService } from './base-service';
import { Product, STORES } from '@/lib/db/idb';

class ProductService extends BaseService<Product> {
  constructor() {
    super(STORES.PRODUCTS);
  }

  async getByBranch(branchId: string): Promise<Product[]> {
    return this.query(p => p.branchId === branchId);
  }

  async bulkCreate(products: Product[]): Promise<void> {
    for (const p of products) {
      await this.create(p);
    }
  }
}

export const productService = new ProductService();
