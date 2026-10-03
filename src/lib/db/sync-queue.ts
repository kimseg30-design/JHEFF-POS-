'use client';

import { dbUtil, STORES, SyncAction, StoreName } from './idb';

/**
 * [SaaS ARCHITECT NOTE]
 * This sync queue is designed for a multi-device cloud environment.
 * 
 * OFFLINE-FIRST STRATEGY:
 * 1. Local-First: All writes go to IndexedDB immediately via syncDb.
 * 2. Background Sync: Changes are queued in 'sync_queue'.
 * 3. Conflict Resolution: Uses 'updatedAt' (Last Write Wins) on the server.
 * 4. Soft Deletes: 'isDeleted' flag ensures deletions propagate across devices.
 * 
 * FUTURE API INTEGRATION:
 * - Implement a /api/sync endpoint that accepts a batch of SyncActions.
 * - The backend should return the server's authoritative state for any conflicted items.
 */

/**
 * Queues an action to be synchronized with the server when online.
 */
export async function queueAction(
  store: StoreName,
  type: 'CREATE' | 'UPDATE' | 'DELETE',
  payload: any
): Promise<void> {
  const action: SyncAction = {
    store,
    type,
    payload: {
      ...payload,
      updatedAt: Date.now(),
      isDeleted: type === 'DELETE'
    },
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };

  try {
    await dbUtil.addItem(STORES.SYNC_QUEUE, action);
    console.log(`[CloudSync] Queued ${type} for ${store}`);
    
    // Trigger background sync if online
    if (typeof window !== 'undefined' && window.navigator.onLine) {
      processQueue();
    }
  } catch (error) {
    console.error('[CloudSync] Failed to queue action:', error);
  }
}

/**
 * Marks a specific action as successfully synchronized.
 */
export async function markAsSynced(actionId: number): Promise<void> {
  try {
    await dbUtil.deleteItem(STORES.SYNC_QUEUE, actionId);
    console.log(`[CloudSync] Action ${actionId} synced and removed from queue.`);
  } catch (error) {
    console.error(`[CloudSync] Failed to mark action ${actionId} as synced:`, error);
  }
}

/**
 * Processes the pending synchronization queue in batches.
 */
export async function processQueue(): Promise<void> {
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    return;
  }

  const queue = await dbUtil.getItems<SyncAction>(STORES.SYNC_QUEUE);
  const pendingActions = queue.filter(a => a.status === 'pending' || a.status === 'failed');

  if (pendingActions.length === 0) return;

  console.log(`[CloudSync] Syncing ${pendingActions.length} changes to cloud...`);

  // Batching strategy: Send up to 50 actions at a time
  const BATCH_SIZE = 50;
  const batch = pendingActions.slice(0, BATCH_SIZE);

  try {
    // 1. Mark batch as processing locally
    for (const action of batch) {
      action.status = 'processing';
      await dbUtil.updateItem(STORES.SYNC_QUEUE, action);
    }

    // 2. --- BACKEND INTEGRATION POINT ---
    // Push each pending change to Firebase Realtime Database
    const BASE_URL = ((import.meta as any).env?.VITE_FIREBASE_RTDB_URL || 'https://database-for-inventory-88e9f-default-rtdb.asia-southeast1.firebasedatabase.app/').replace(/\/$/, '');

    for (const action of batch) {
      const { store, payload } = action;
      // Use 'id' or 'key' (for metadata store)
      const key = payload.id || payload.key;
      if (!key) {
        console.warn('[CloudSync] Missing key for action payload:', payload);
        continue;
      }

      const url = `${BASE_URL}/${store}/${key}.json`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Sync failed for action on ${store}/${key}: ${response.statusText}`);
      }
    }
    
    // 3. On success, remove from queue
    for (const action of batch) {
      if (action.id) {
        await markAsSynced(action.id);
      }
    }

    // 4. Update store-wide sync timestamp
    const storeInfo = await dbUtil.getItems<any>(STORES.STORE_INFO);
    if (storeInfo.length > 0) {
      const info = storeInfo[0];
      info.lastSyncedAt = Date.now();
      await dbUtil.updateItem(STORES.STORE_INFO, info);
    }

    // 5. If there are more items, continue processing
    if (pendingActions.length > BATCH_SIZE) {
      processQueue();
    }
  } catch (error) {
    console.error('[CloudSync] Batch sync failed:', error);
    // Revert status to failed for retry
    for (const action of batch) {
      action.status = 'failed';
      action.retryCount += 1;
      await dbUtil.updateItem(STORES.SYNC_QUEUE, action);
    }
  }
}

/**
 * Pulls all updates from Firebase Realtime Database and merges them locally.
 * Uses Last Write Wins based on 'updatedAt' timestamp.
 */
export async function pullSync(): Promise<void> {
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    return;
  }

  const BASE_URL = ((import.meta as any).env?.VITE_FIREBASE_RTDB_URL || 'https://database-for-inventory-88e9f-default-rtdb.asia-southeast1.firebasedatabase.app/').replace(/\/$/, '');
  
  // We sync all stores except the sync_queue itself
  const storesToSync = [
    STORES.STORE_INFO,
    STORES.BRANCHES,
    STORES.PRODUCTS,
    STORES.TRANSACTIONS,
    STORES.CUSTOMERS,
    STORES.CREDIT_LOG,
    STORES.METADATA,
    STORES.EWALLET_TRANSACTIONS,
    STORES.SUPPLIERS,
    STORES.RESTOCK_TRANSACTIONS,
    STORES.AUDIT_LOGS,
    STORES.USERS,
    STORES.EXPENSES
  ];

  console.log('[CloudSync] Starting full pull sync from Firebase RTDB...');
  let unauthorizedCount = 0;

  for (const store of storesToSync) {
    try {
      const url = `${BASE_URL}/${store}.json`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[CloudSync] Failed to fetch store ${store}:`, response.statusText);
        if (response.status === 401 || response.status === 403 || response.statusText === 'Unauthorized') {
          unauthorizedCount++;
        }
        continue;
      }

      const data = await response.json();
      if (!data) {
        console.log(`[CloudSync] Store ${store} is empty on Firebase.`);
        continue;
      }

      // Firebase returns { id1: item1, id2: item2 } or an array of items if IDs are numeric indexes
      const cloudItems: any[] = Array.isArray(data) 
        ? data.filter(Boolean)
        : Object.values(data);

      console.log(`[CloudSync] Pulled ${cloudItems.length} items from cloud for store: ${store}`);

      for (const cloudItem of cloudItems) {
        const key = cloudItem.id || cloudItem.key;
        if (!key) continue;

        // Fetch local item to compare
        const localItem = await dbUtil.getItemById<any>(store, key);

        if (!localItem) {
          // Item doesn't exist locally, save it
          await dbUtil.updateItem(store, cloudItem);
        } else {
          // Compare updatedAt
          const cloudUpdatedAt = cloudItem.updatedAt || 0;
          const localUpdatedAt = localItem.updatedAt || 0;

          if (cloudUpdatedAt > localUpdatedAt) {
            // Cloud has newer data, update local
            await dbUtil.updateItem(store, cloudItem);
          } else if (localUpdatedAt > cloudUpdatedAt) {
            // Local has newer data, queue it for push
            console.log(`[CloudSync] Local item ${key} in ${store} is newer. Will push to cloud.`);
            await queueAction(store, 'UPDATE', localItem);
          }
        }
      }
    } catch (error) {
      console.error(`[CloudSync] Error syncing store ${store}:`, error);
    }
  }

  if (unauthorizedCount > 0) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('firebase_sync_error', 'Unauthorized');
    }
    throw new Error('Unauthorized');
  } else {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('firebase_sync_error');
    }
  }

  // Update store-wide sync timestamp
  try {
    const storeInfo = await dbUtil.getItems<any>(STORES.STORE_INFO);
    if (storeInfo.length > 0) {
      const info = storeInfo[0];
      info.lastSyncedAt = Date.now();
      await dbUtil.updateItem(STORES.STORE_INFO, info);
    }
  } catch (error) {
    console.error('[CloudSync] Failed to update sync timestamp:', error);
  }

  console.log('[CloudSync] Pull sync completed.');
}

/**
 * SaaS-ready DB wrapper.
 */
export const syncDb = {
  async add<T>(store: StoreName, item: T): Promise<any> {
    const result = await dbUtil.addItem(store, item);
    await queueAction(store, 'CREATE', item);
    return result;
  },

  async update<T>(store: StoreName, item: T): Promise<any> {
    const result = await dbUtil.updateItem(store, item);
    await queueAction(store, 'UPDATE', item);
    return result;
  },

  async delete(store: StoreName, id: string | number): Promise<void> {
    const item = await dbUtil.getItemById<any>(store, id);
    if (item) {
      // For metadata, the ID might be 'key'
      const key = (item as any).id || (item as any).key || id;
      await dbUtil.deleteItem(store, id);
      await queueAction(store, 'DELETE', { ...item, id: key, isDeleted: true });
    }
  }
};

/**
 * Wipes all data (products, transactions, customers, credit_log, ewallet_transactions, suppliers, restock_transactions, audit_logs, metadata, sync_queue) 
 * both locally in IndexedDB and remotely in the connected Firebase Realtime Database.
 * This effectively removes all dummy data to let the user start fresh.
 */
export async function clearDatabaseAll(): Promise<void> {
  const storesToClear = [
    STORES.PRODUCTS,
    STORES.TRANSACTIONS,
    STORES.CUSTOMERS,
    STORES.CREDIT_LOG,
    STORES.EWALLET_TRANSACTIONS,
    STORES.SUPPLIERS,
    STORES.RESTOCK_TRANSACTIONS,
    STORES.AUDIT_LOGS,
    STORES.METADATA,
    STORES.SYNC_QUEUE,
    STORES.EXPENSES
  ];

  console.log('[CloudSync] Clearing all local IndexedDB stores...');

  // 1. Clear local IndexedDB stores
  for (const store of storesToClear) {
    try {
      await dbUtil.clearStore(store);
      console.log(`[CloudSync] Cleared local store: ${store}`);
    } catch (e) {
      console.error(`[CloudSync] Failed to clear local store ${store}:`, e);
    }
  }

  // 2. Clear remote Firebase Realtime Database for those stores
  const BASE_URL = ((import.meta as any).env?.VITE_FIREBASE_RTDB_URL || 'https://database-for-inventory-88e9f-default-rtdb.asia-southeast1.firebasedatabase.app/').replace(/\/$/, '');
  
  if (typeof window !== 'undefined' && window.navigator.onLine) {
    console.log('[CloudSync] Deleting remote stores from Firebase...');
    for (const store of storesToClear) {
      try {
        const url = `${BASE_URL}/${store}.json`;
        const response = await fetch(url, {
          method: 'DELETE'
        });
        if (response.ok) {
          console.log(`[CloudSync] Successfully deleted store ${store} on Firebase.`);
        } else {
          console.error(`[CloudSync] Failed to delete store ${store} on Firebase:`, response.statusText);
        }
      } catch (e) {
        console.error(`[CloudSync] Error deleting store ${store} on Firebase:`, e);
      }
    }
  }

  // 3. Clear branches and recreate a single Main Branch to keep system operational
  try {
    await dbUtil.clearStore(STORES.BRANCHES);
    const storeInfo = await dbUtil.getItems<any>(STORES.STORE_INFO);
    const businessId = storeInfo[0]?.id || 'main_config';
    const mainBranchId = crypto.randomUUID();
    const now = Date.now();
    const defaultBranch = {
      id: mainBranchId,
      name: 'Main Branch',
      address: storeInfo[0]?.address || 'Main Address',
      businessId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false
    };
    await dbUtil.addItem(STORES.BRANCHES, defaultBranch);
    localStorage.setItem('sarisari_current_branch_id', mainBranchId);

    if (typeof window !== 'undefined' && window.navigator.onLine) {
      await fetch(`${BASE_URL}/${STORES.BRANCHES}.json`, { method: 'DELETE' });
      await fetch(`${BASE_URL}/${STORES.BRANCHES}/${mainBranchId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultBranch)
      });
    }
  } catch (e) {
    console.error('Failed to reset branches:', e);
  }

  console.log('[CloudSync] Database wipe completed.');
}

// Listen for online event to trigger sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncQueue] Back online! Triggering sync...');
    processQueue();
  });
}
