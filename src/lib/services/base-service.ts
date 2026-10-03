'use client';

import { dbUtil, STORES, StoreName } from '@/lib/db/idb';
import { syncDb } from '@/lib/db/sync-queue';

/**
 * [SaaS ARCHITECT NOTE]
 * The BaseService provides a standardized interface for all data operations.
 * 
 * DESIGN FOR CLOUD SYNC:
 * 1. Read Operations: Currently fetch from IndexedDB (local cache).
 * 2. Write Operations: Use syncDb to ensure changes are queued for cloud sync.
 * 3. Future API Integration: Replace or augment these methods with fetch() calls to your backend.
 *    The hooks and components won't need to change because they depend on this service layer.
 */
export class BaseService<T extends { id: string; isDeleted?: boolean; updatedAt: number }> {
  constructor(protected storeName: StoreName) {}

  async getAll(): Promise<T[]> {
    const items = await dbUtil.getItems<T>(this.storeName);
    // Filter out soft-deleted items
    return items.filter(item => !item.isDeleted);
  }

  async getById(id: string): Promise<T | undefined> {
    const item = await dbUtil.getItemById<T>(this.storeName, id);
    if (item?.isDeleted) return undefined;
    return item;
  }

  async create(item: Omit<T, 'updatedAt' | 'isDeleted'>): Promise<string> {
    const now = Date.now();
    const newItem = {
      ...item,
      updatedAt: now,
      isDeleted: false,
    } as T;
    
    return await syncDb.add(this.storeName, newItem);
  }

  async update(item: T): Promise<string> {
    const updatedItem = {
      ...item,
      updatedAt: Date.now(),
    };
    
    return await syncDb.update(this.storeName, updatedItem);
  }

  async delete(id: string): Promise<void> {
    await syncDb.delete(this.storeName, id);
  }

  /**
   * Helper for complex filtering that might eventually happen on the server.
   */
  async query(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.getAll();
    return all.filter(predicate);
  }
}
