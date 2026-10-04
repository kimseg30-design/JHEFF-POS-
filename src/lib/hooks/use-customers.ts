'use client';

import { useState, useEffect, useCallback } from 'react';
import { Customer, CreditEntry } from '@/lib/db/idb';
import { customerService } from '@/lib/services/customer-service';

export function useCustomers(branchId?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      let data: Customer[];
      if (branchId) {
        data = await customerService.getByBranch(branchId);
      } else {
        data = await customerService.getAll();
      }
      setCustomers(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalUtang' | 'branchId' | 'isDeleted'>) => {
    if (!branchId) throw new Error('Branch ID is required to add a customer');
    const id = crypto.randomUUID();
    const now = Date.now();
    await customerService.create({
      ...customer,
      id,
      totalUtang: 0,
      branchId,
      createdAt: now,
    });
    await fetchCustomers();
  };

  const updateCustomer = async (customer: Customer) => {
    await customerService.update(customer);
    await fetchCustomers();
  };

  const deleteCustomer = async (id: string) => {
    await customerService.delete(id);
    await fetchCustomers();
  };

  const recordCredit = async (
    customerId: string, 
    amount: number, 
    description: string, 
    type: 'credit' | 'payment',
    targetCreditId?: string,
    customTimestamp?: number
  ) => {
    if (!branchId) throw new Error('Branch ID is required to record credit');
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const now = Date.now();
    const entryTimestamp = customTimestamp && !isNaN(customTimestamp) ? customTimestamp : now;
    const entry: Omit<CreditEntry, 'updatedAt' | 'isDeleted'> = {
      id: crypto.randomUUID(),
      customerId,
      branchId,
      amount: type === 'credit' ? amount : -amount,
      type,
      description,
      timestamp: entryTimestamp,
      ...(targetCreditId ? { targetCreditId } : {}),
    };

    await customerService.recordCredit(entry);
    
    const updatedCustomer = {
      ...customer,
      totalUtang: Math.max(0, customer.totalUtang + entry.amount),
      updatedAt: now,
    };
    
    await customerService.update(updatedCustomer);
    await fetchCustomers();
  };

  const getCreditHistory = async (customerId: string) => {
    const history = await customerService.getCreditHistory(customerId);
    return history.sort((a, b) => b.timestamp - a.timestamp);
  };

  const getAllCreditLogs = async () => {
    const history = await customerService.getAllCreditEntries(branchId);
    return history.sort((a, b) => b.timestamp - a.timestamp);
  };

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCredit,
    getCreditHistory,
    getAllCreditLogs,
    refresh: fetchCustomers,
  };
}
