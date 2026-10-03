'use client';

import { useState, useEffect, useCallback } from 'react';
import { EWalletTransaction } from '@/lib/db/idb';
import { ewalletService } from '@/lib/services/ewallet-service';
import { auditService } from '@/lib/services/audit-service';

export function useEWallet(branchId?: string) {
  const [transactions, setTransactions] = useState<EWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let data: EWalletTransaction[];
      if (branchId) {
        data = await ewalletService.getByBranch(branchId);
      } else {
        data = await ewalletService.getAll();
      }
      
      setTransactions(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to fetch e-wallet transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: Omit<EWalletTransaction, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newTransaction: EWalletTransaction = {
      ...transaction,
      id,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    await ewalletService.create(newTransaction);
    await auditService.log('EWALLET_TRANSACTION', JSON.stringify({ 
      type: transaction.type, 
      amount: transaction.amount, 
      method: transaction.method,
      reference: transaction.referenceNumber 
    }));
    await fetchTransactions();
    return newTransaction;
  };

  const getStats = useCallback(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'cash_in') {
        acc.totalCashIn += t.amount;
      } else {
        acc.totalCashOut += t.amount;
      }
      acc.totalFees += t.fee || 0;
      return acc;
    }, { totalCashIn: 0, totalCashOut: 0, totalFees: 0 });
  }, [transactions]);

  return {
    transactions,
    loading,
    addTransaction,
    getStats,
    refresh: fetchTransactions,
  };
}
