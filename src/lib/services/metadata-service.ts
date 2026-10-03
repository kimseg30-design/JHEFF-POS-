'use client';

import { dbUtil, STORES } from '@/lib/db/idb';
import { syncDb } from '@/lib/db/sync-queue';

export type MetadataEntry = {
  key: string;
  value: string;
  updatedAt: number;
  isDeleted?: boolean;
};

class MetadataService {
  private storeName = STORES.METADATA;

  async get(key: string): Promise<MetadataEntry | undefined> {
    const item = await dbUtil.getItemById<MetadataEntry>(this.storeName, key);
    if (item?.isDeleted) return undefined;
    return item;
  }

  async set(key: string, value: string): Promise<string> {
    const now = Date.now();
    const entry: MetadataEntry = {
      key,
      value,
      updatedAt: now,
      isDeleted: false,
    };
    
    // We use syncDb to ensure metadata is also synced if needed
    // Note: syncDb might need to handle 'key' as keyPath if it's not 'id'
    return await syncDb.update(this.storeName, entry);
  }

  async delete(key: string): Promise<void> {
    await syncDb.delete(this.storeName, key);
  }
}

export const metadataService = new MetadataService();
