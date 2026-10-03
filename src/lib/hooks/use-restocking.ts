'use client';

import { useState, useEffect, useCallback } from 'react';
import { Supplier, RestockTransaction, RestockItem } from '@/lib/db/idb';
import { useBranches } from './use-branches';
import { restockService } from '@/lib/services/restock-service';
import { productService } from '@/lib/services/product-service';
import { useAuth } from '@/lib/contexts/auth-context';
import { expenseService } from '@/lib/services/expense-service';

export function useRestocking() {
  const { currentBranch } = useBranches();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [restockHistory, setRestockHistory] = useState<RestockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentBranch) return;
    setLoading(true);
    try {
      const [branchSuppliers, branchRestocks] = await Promise.all([
        restockService.getSuppliersByBranch(currentBranch.id),
        restockService.getByBranch(currentBranch.id)
      ]);

      setSuppliers(branchSuppliers);
      setRestockHistory(branchRestocks.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error fetching restocking data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentBranch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'branchId' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    if (!currentBranch) return;
    const id = crypto.randomUUID();
    const now = Date.now();
    await restockService.createSupplier({
      ...supplierData,
      id,
      branchId: currentBranch.id,
      createdAt: now,
    });
    await fetchData();
  };

  const updateSupplier = async (supplier: Supplier) => {
    await restockService.updateSupplier(supplier);
    await fetchData();
  };

  const deleteSupplier = async (id: string) => {
    await restockService.deleteSupplier(id);
    await fetchData();
  };

  const recordRestock = async (
    supplierId: string, 
    items: RestockItem[], 
    totalCost: number, 
    referenceNumber?: string, 
    notes?: string
  ) => {
    if (!currentBranch) return;

    const id = crypto.randomUUID();
    const now = Date.now();
    const restockTx: RestockTransaction = {
      id,
      supplierId,
      items,
      totalCost,
      timestamp: now,
      branchId: currentBranch.id,
      referenceNumber,
      notes,
      updatedAt: now,
      isDeleted: false
    };

    // 1. Save restock transaction
    await restockService.create(restockTx);

    // 2. Update product stocks
    for (const item of items) {
      const product = await productService.getById(item.productId);
      if (product) {
        const updatedProduct = {
          ...product,
          stock: product.stock + item.quantity,
          updatedAt: now
        };
        await productService.update(updatedProduct);
      }
    }

    // 3. Automatically log corresponding expense
    try {
      const supplier = suppliers.find(s => s.id === supplierId);
      const supplierName = supplier ? supplier.name : 'Unknown Supplier';
      const itemsSummary = items.map(i => `${i.name} (x${i.quantity})`).join(', ');
      
      await expenseService.create({
        id: crypto.randomUUID(),
        description: `Restock: ${itemsSummary} from ${supplierName}`,
        amount: totalCost,
        category: 'Inventory Restock',
        timestamp: now,
        branchId: currentBranch.id,
        createdBy: user?.name || user?.email || 'System',
        referenceNumber
      });
    } catch (expError) {
      console.error('Failed to auto-log restock as expense:', expError);
    }

    await fetchData();
  };

  return {
    suppliers,
    restockHistory,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordRestock,
    refresh: fetchData
  };
}
