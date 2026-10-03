'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense } from '@/lib/db/idb';
import { expenseService } from '@/lib/services/expense-service';

export function useExpenses(branchId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      let data: Expense[];
      if (branchId) {
        data = await expenseService.getByBranch(branchId);
      } else {
        data = await expenseService.getAll();
      }
      setExpenses(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'branchId' | 'updatedAt' | 'isDeleted' | 'timestamp'>) => {
    if (!branchId) throw new Error('Branch ID is required to add an expense');
    const id = crypto.randomUUID();
    const now = Date.now();
    await expenseService.create({
      ...expense,
      id,
      branchId,
      timestamp: now,
    });
    await fetchExpenses();
  };

  const updateExpense = async (expense: Expense) => {
    await expenseService.update(expense);
    await fetchExpenses();
  };

  const deleteExpense = async (id: string) => {
    await expenseService.delete(id);
    await fetchExpenses();
  };

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refresh: fetchExpenses,
  };
}
