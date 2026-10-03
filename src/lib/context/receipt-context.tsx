'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Receipt } from '@/components/pos/receipt';
import { StoreInfo, Branch } from '@/lib/db/idb';
import { useBranches } from '@/lib/hooks/use-branches';
import { storeService } from '@/lib/services/store-service';

interface ReceiptData {
  ticketNumber: string;
  orNumber?: string; // Added for OR numbering
  timestamp: number;
  items: any[];
  total: number;
  vatableSales?: number;
  vatAmount?: number;
  taxType?: 'VAT' | 'NON-VAT';
  paymentMethod: string;
  type?: 'sales' | 'ewallet';
  ewalletDetails?: {
    type: string;
    method: string;
    fee: number;
    customerName?: string;
    referenceNumber?: string;
  };
}

interface ReceiptContextType {
  showReceipt: (data: ReceiptData, onClose?: () => void) => void;
  closeReceipt: () => void;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export function ReceiptProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [onCloseCallback, setOnCloseCallback] = useState<(() => void) | null>(null);
  const { currentBranch } = useBranches();

  useEffect(() => {
    const fetchStore = async () => {
      const store = await storeService.getStore();
      if (store) setStoreInfo(store);
    };
    fetchStore();
  }, []);

  const showReceipt = (data: ReceiptData, onClose?: () => void) => {
    setReceiptData(data);
    setOnCloseCallback(() => onClose || null);
    setIsOpen(true);
  };

  const closeReceipt = () => {
    if (onCloseCallback) onCloseCallback();
    setIsOpen(false);
    setReceiptData(null);
    setOnCloseCallback(null);
  };

  return (
    <ReceiptContext.Provider value={{ showReceipt, closeReceipt }}>
      {children}
      {isOpen && receiptData && (
        <Receipt
          store={storeInfo}
          branch={currentBranch || null}
          {...receiptData}
          onClose={closeReceipt}
        />
      )}
    </ReceiptContext.Provider>
  );
}

export function useReceipt() {
  const context = useContext(ReceiptContext);
  if (context === undefined) {
    throw new Error('useReceipt must be used within a ReceiptProvider');
  }
  return context;
}
