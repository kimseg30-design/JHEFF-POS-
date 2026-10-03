'use client';

import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/lib/db/idb';
import { transactionService } from '@/lib/services/transaction-service';
import { metadataService } from '@/lib/services/metadata-service';

export function useTransactions(branchId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let data: Transaction[];
      if (branchId) {
        data = await transactionService.getByBranch(branchId);
      } else {
        data = await transactionService.getAll();
      }
      
      setTransactions(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'updatedAt' | 'isDeleted'>) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      updatedAt: now,
      isDeleted: false,
    };
    await transactionService.create(newTransaction);
    
    // Update last ticket number in metadata for fast sequential generation
    try {
      const metaKey = `last_ticket_number_${newTransaction.branchId}`;
      await metadataService.set(metaKey, newTransaction.ticketNumber);
    } catch (e) {
      console.error('Failed to update ticket metadata:', e);
    }

    await fetchTransactions();
    return newTransaction;
  };

  const getNextTicketNumber = useCallback(async () => {
    if (!branchId) return 'T-0001';
    try {
      // 1. Try to get from metadata for speed
      const metaKey = `last_ticket_number_${branchId}`;
      const lastTicketMeta = await metadataService.get(metaKey);
      
      let lastTicket = lastTicketMeta?.value;

      // 2. Fallback to scanning transactions if metadata is missing (e.g. first time or after clear)
      if (!lastTicket) {
        const activeTransactions = await transactionService.getByBranch(branchId);
        
        if (activeTransactions.length > 0) {
          const sorted = [...activeTransactions].sort((a, b) => b.timestamp - a.timestamp);
          lastTicket = sorted[0].ticketNumber;
        }
      }
      
      if (!lastTicket) {
        return 'T-0001';
      }
      
      const match = lastTicket.match(/T-(\d+)/);
      if (!match) return 'T-0001';
      
      const nextNum = parseInt(match[1], 10) + 1;
      return `T-${nextNum.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Failed to generate next ticket number:', error);
      return 'T-0001';
    }
  }, [branchId]);

  return {
    transactions,
    loading,
    addTransaction,
    getNextTicketNumber,
    refresh: fetchTransactions,
  };
}
