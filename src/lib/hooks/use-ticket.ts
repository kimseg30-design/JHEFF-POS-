'use client';

import { useState, useEffect, useCallback } from 'react';
import { metadataService } from '@/lib/services/metadata-service';
import { transactionService } from '@/lib/services/transaction-service';

export function useTicket(branchId?: string) {
  const [currentTicket, setCurrentTicket] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const generateNextNumber = useCallback((lastTicket: string | undefined): string => {
    if (!lastTicket) return 'T-0001';
    
    const match = lastTicket.match(/T-(\d+)/);
    if (!match) return 'T-0001';
    
    const nextNum = parseInt(match[1], 10) + 1;
    return `T-${nextNum.toString().padStart(4, '0')}`;
  }, []);

  const fetchTicket = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const metaKey = `last_ticket_number_${branchId}`;
      const meta = await metadataService.get(metaKey);
      let lastTicket = meta?.value;

      if (!lastTicket) {
        // Fallback to scanning transactions if metadata is empty
        const active = await transactionService.getByBranch(branchId);
        if (active.length > 0) {
          const sorted = active.sort((a: any, b: any) => b.timestamp - a.timestamp);
          lastTicket = sorted[0].ticketNumber;
        }
      }

      const next = generateNextNumber(lastTicket);
      setCurrentTicket(next);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      setCurrentTicket('T-0001');
    } finally {
      setLoading(false);
    }
  }, [generateNextNumber, branchId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const rotateTicket = useCallback(async () => {
    const next = generateNextNumber(currentTicket);
    setCurrentTicket(next);
    return next;
  }, [currentTicket, generateNextNumber]);

  return {
    currentTicket,
    rotateTicket,
    loading,
    refresh: fetchTicket
  };
}
