'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Banknote, 
  Smartphone, 
  Building2, 
  BookUser, 
  Layers, 
  Check, 
  AlertCircle, 
  UserPlus, 
  Receipt, 
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '@/lib/db/idb';

export type PaymentMethodType = 'cash' | 'gcash' | 'bank_transfer' | 'credit' | 'split';

export interface SplitItem {
  id: string;
  method: 'cash' | 'gcash' | 'bank_transfer' | 'credit';
  amount: number;
  reference?: string;
  bankName?: string;
  customerId?: string;
  customerName?: string;
}

export interface CheckoutResult {
  paymentMethod: PaymentMethodType;
  amountPaid: number;
  change: number;
  customerId?: string;
  customerName?: string;
  paymentDetails: {
    referenceNumber?: string;
    bankName?: string;
    notes?: string;
    splitBreakdown?: {
      method: string;
      amount: number;
      reference?: string;
      customerId?: string;
      customerName?: string;
    }[];
  };
}

interface CheckoutModalProps {
  total: number;
  itemCount: number;
  customers: Customer[];
  onAddCustomer: (name: string, contact: string) => Promise<Customer | undefined>;
  onConfirm: (result: CheckoutResult) => Promise<void>;
  onClose: () => void;
}

const PHILIPPINE_BANKS = [
  'BDO Unibank',
  'BPI (Bank of the Philippine Islands)',
  'Metrobank',
  'UnionBank of the Philippines',
  'Landbank',
  'Security Bank',
  'Maya Bank',
  'RCBC',
  'PNB',
  'SeaBank',
  'Other Bank'
];

export function CheckoutModal({
  total,
  itemCount,
  customers,
  onAddCustomer,
  onConfirm,
  onClose,
}: CheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cash state
  const [cashTendered, setCashTendered] = useState<number>(total);
  const [cashInputString, setCashInputString] = useState<string>(String(total));

  // GCash state
  const [gcashRef, setGcashRef] = useState('');
  const [gcashCustomerName, setGcashCustomerName] = useState('');

  // Bank Transfer state
  const [bankName, setBankName] = useState(PHILIPPINE_BANKS[0]);
  const [bankRef, setBankRef] = useState('');

  // Credit (Utang) state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers.length > 0 ? customers[0].id : ''
  );
  const [creditNotes, setCreditNotes] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // New Customer inline modal state
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerContact, setNewCustomerContact] = useState('');
  const [isSavingNewCustomer, setIsSavingNewCustomer] = useState(false);

  // Split Payment state
  // Default to Cash + Credit for Remaining Balances (as requested)
  const [splitItems, setSplitItems] = useState<SplitItem[]>([
    {
      id: 'split-1',
      method: 'cash',
      amount: Math.floor(total / 2) || total,
    },
    {
      id: 'split-2',
      method: 'credit',
      amount: Math.max(0, total - (Math.floor(total / 2) || total)),
      customerId: customers.length > 0 ? customers[0].id : '',
      customerName: customers.length > 0 ? customers[0].name : '',
    }
  ]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.contact && c.contact.includes(q))
    );
  }, [customers, customerSearch]);

  // Quick cash bill presets
  const quickBills = useMemo(() => {
    const bills = [total, 100, 200, 500, 1000, 2000].filter(b => b >= total);
    return Array.from(new Set([total, ...bills])).sort((a, b) => a - b).slice(0, 5);
  }, [total]);

  // Cash change calculation
  const cashChange = Math.max(0, cashTendered - total);
  const isCashSufficient = cashTendered >= total;

  // Split payment totals
  const splitTotalAllocated = splitItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const splitRemaining = Math.round((total - splitTotalAllocated) * 100) / 100;
  const isSplitBalanced = Math.abs(splitRemaining) < 0.01;

  // Handle cash input
  const handleCashChange = (val: string) => {
    setCashInputString(val);
    const num = parseFloat(val);
    setCashTendered(isNaN(num) ? 0 : num);
  };

  const handleSelectQuickBill = (amount: number) => {
    setCashTendered(amount);
    setCashInputString(String(amount));
  };

  // Add new customer inline
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    setIsSavingNewCustomer(true);
    try {
      const created = await onAddCustomer(newCustomerName.trim(), newCustomerContact.trim());
      if (created) {
        setSelectedCustomerId(created.id);
        setIsAddingNewCustomer(false);
        setNewCustomerName('');
        setNewCustomerContact('');
      }
    } catch (err) {
      console.error('Failed to create customer:', err);
    } finally {
      setIsSavingNewCustomer(false);
    }
  };

  // Split item helpers
  const handleUpdateSplitItem = (id: string, updates: Partial<SplitItem>) => {
    setSplitItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        if (updates.customerId) {
          const cust = customers.find(c => c.id === updates.customerId);
          if (cust) updated.customerName = cust.name;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleAddSplitItem = (method: 'cash' | 'gcash' | 'bank_transfer' | 'credit') => {
    const defaultCust = customers[0];
    const newPortion: SplitItem = {
      id: `split-${Date.now()}-${Math.random()}`,
      method,
      amount: Math.max(0, splitRemaining),
      customerId: method === 'credit' ? (defaultCust ? defaultCust.id : '') : undefined,
      customerName: method === 'credit' ? (defaultCust ? defaultCust.name : '') : undefined,
    };
    setSplitItems(prev => [...prev, newPortion]);
  };

  const handleRemoveSplitItem = (id: string) => {
    if (splitItems.length <= 1) return;
    setSplitItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAllocateRemainingToMethod = (targetIndex: number) => {
    if (splitRemaining === 0) return;
    setSplitItems(prev => prev.map((item, idx) => {
      if (idx === targetIndex) {
        return { ...item, amount: Math.max(0, item.amount + splitRemaining) };
      }
      return item;
    }));
  };

  const handleSetCashCreditPreset = () => {
    const half = Math.round((total / 2) * 100) / 100;
    const defaultCust = customers[0];
    setSplitItems([
      {
        id: `split-cash-${Date.now()}`,
        method: 'cash',
        amount: half,
      },
      {
        id: `split-credit-${Date.now()}`,
        method: 'credit',
        amount: Math.round((total - half) * 100) / 100,
        customerId: defaultCust?.id || '',
        customerName: defaultCust?.name || '',
      }
    ]);
  };

  const handleAssignRemainingToCredit = () => {
    if (splitRemaining <= 0) return;
    const defaultCust = customers[0];
    const creditIndex = splitItems.findIndex(i => i.method === 'credit');
    if (creditIndex >= 0) {
      handleAllocateRemainingToMethod(creditIndex);
    } else {
      setSplitItems(prev => [
        ...prev,
        {
          id: `split-${Date.now()}`,
          method: 'credit',
          amount: splitRemaining,
          customerId: defaultCust?.id || '',
          customerName: defaultCust?.name || '',
        }
      ]);
    }
  };

  const handleAssignRemainingToCash = () => {
    if (splitRemaining <= 0) return;
    const cashIndex = splitItems.findIndex(i => i.method === 'cash');
    if (cashIndex >= 0) {
      handleAllocateRemainingToMethod(cashIndex);
    } else {
      setSplitItems(prev => [
        ...prev,
        {
          id: `split-${Date.now()}`,
          method: 'cash',
          amount: splitRemaining,
        }
      ]);
    }
  };

  // Final submit
  const handleCompletePayment = async () => {
    if (isSubmitting) return;

    // Validation
    if (selectedMethod === 'cash' && !isCashSufficient) {
      return;
    }
    if (selectedMethod === 'credit' && !selectedCustomerId) {
      alert('Please select a customer for credit (utang) purchase.');
      return;
    }
    if (selectedMethod === 'split') {
      if (!isSplitBalanced) {
        alert(`Split total must equal ₱${total.toFixed(2)}. Currently remaining: ₱${splitRemaining.toFixed(2)}`);
        return;
      }
      const hasCreditPortionWithoutCustomer = splitItems.some(
        item => item.method === 'credit' && item.amount > 0 && !item.customerId
      );
      if (hasCreditPortionWithoutCustomer) {
        alert('Please select a customer for the credit portion in split payment.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let result: CheckoutResult;

      if (selectedMethod === 'cash') {
        result = {
          paymentMethod: 'cash',
          amountPaid: cashTendered,
          change: cashChange,
          paymentDetails: {},
        };
      } else if (selectedMethod === 'gcash') {
        result = {
          paymentMethod: 'gcash',
          amountPaid: total,
          change: 0,
          customerName: gcashCustomerName || undefined,
          paymentDetails: {
            referenceNumber: gcashRef || undefined,
            notes: 'GCash Payment',
          },
        };
      } else if (selectedMethod === 'bank_transfer') {
        result = {
          paymentMethod: 'bank_transfer',
          amountPaid: total,
          change: 0,
          paymentDetails: {
            bankName,
            referenceNumber: bankRef || undefined,
            notes: `Bank Transfer (${bankName})`,
          },
        };
      } else if (selectedMethod === 'credit') {
        result = {
          paymentMethod: 'credit',
          amountPaid: total,
          change: 0,
          customerId: selectedCustomerId,
          customerName: selectedCustomer?.name,
          paymentDetails: {
            notes: creditNotes || 'Credit purchase (Utang)',
          },
        };
      } else {
        // Split payment
        const creditPortion = splitItems.find(item => item.method === 'credit' && item.amount > 0);
        result = {
          paymentMethod: 'split',
          amountPaid: total,
          change: 0,
          customerId: creditPortion?.customerId,
          customerName: creditPortion?.customerName,
          paymentDetails: {
            splitBreakdown: splitItems.map(item => ({
              method: item.method,
              amount: Number(item.amount) || 0,
              reference: item.reference,
              customerId: item.customerId,
              customerName: item.customerName,
            })),
            notes: 'Split Payment',
          },
        };
      }

      await onConfirm(result);
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] transition-colors"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-none">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                Complete Checkout
              </h2>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Total Due Banner */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xl shadow-orange-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-orange-100">
                Total Amount Due
              </span>
              <p className="text-4xl sm:text-5xl font-black tracking-tight leading-none mt-1">
                ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-100/90 bg-white/20 px-3 py-1 rounded-full">
                All Taxes Included
              </span>
              <p className="text-xs text-orange-100 mt-1.5 font-medium">
                Choose a payment method below
              </p>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 block">
              Select Mode of Payment
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Cash */}
              <button
                type="button"
                onClick={() => setSelectedMethod('cash')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer active:scale-95 ${
                  selectedMethod === 'cash'
                    ? 'border-orange-600 bg-orange-50/70 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shadow-sm ring-2 ring-orange-500/20'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedMethod === 'cash' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <span className="font-black text-xs uppercase tracking-tight">Cash</span>
              </button>

              {/* GCash */}
              <button
                type="button"
                onClick={() => setSelectedMethod('gcash')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer active:scale-95 ${
                  selectedMethod === 'gcash'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm ring-2 ring-blue-500/20'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedMethod === 'gcash' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="font-black text-xs uppercase tracking-tight">GCash</span>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                onClick={() => setSelectedMethod('bank_transfer')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer active:scale-95 ${
                  selectedMethod === 'bank_transfer'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedMethod === 'bank_transfer' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="font-black text-xs uppercase tracking-tight">Bank</span>
              </button>

              {/* Credit (Utang) */}
              <button
                type="button"
                onClick={() => setSelectedMethod('credit')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer active:scale-95 ${
                  selectedMethod === 'credit'
                    ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shadow-sm ring-2 ring-purple-500/20'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedMethod === 'credit' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  <BookUser className="w-5 h-5" />
                </div>
                <span className="font-black text-xs uppercase tracking-tight">Credit (Utang)</span>
              </button>

              {/* Split Payment */}
              <button
                type="button"
                onClick={() => setSelectedMethod('split')}
                className={`col-span-2 sm:col-span-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer active:scale-95 ${
                  selectedMethod === 'split'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedMethod === 'split' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <span className="font-black text-xs uppercase tracking-tight">Split Payment</span>
              </button>
            </div>
          </div>

          {/* Payment Specific Controls */}
          <div className="bg-gray-50/70 dark:bg-gray-800/30 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800">
            {/* CASH VIEW */}
            {selectedMethod === 'cash' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Amount Tendered (₱)
                    </label>
                    <span className="text-xs font-bold text-gray-400">
                      Minimum ₱{total.toFixed(2)}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={cashInputString}
                      onChange={(e) => handleCashChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500 dark:focus:border-orange-500 rounded-2xl pl-14 pr-6 py-4 font-black text-2xl sm:text-3xl text-gray-900 dark:text-white outline-none transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Quick Bills buttons */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 block">
                    Quick Bill Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickBills.map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => handleSelectQuickBill(bill)}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase transition-all cursor-pointer ${
                          cashTendered === bill
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {bill === total ? 'Exact Amount' : `₱${bill.toLocaleString()}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change preview */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                  isCashSufficient
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                }`}>
                  <div>
                    <span className={`text-[11px] font-black uppercase tracking-wider block ${
                      isCashSufficient ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    }`}>
                      {isCashSufficient ? 'Customer Change' : 'Insufficient Amount'}
                    </span>
                    <span className={`text-2xl sm:text-3xl font-black ${
                      isCashSufficient ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      ₱{cashChange.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {!isCashSufficient && (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Need ₱{(total - cashTendered).toFixed(2)} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* GCASH VIEW */}
            {selectedMethod === 'gcash' && (
              <div className="space-y-5">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900 flex items-center gap-3">
                  <Smartphone className="w-6 h-6 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-900 dark:text-blue-300 font-medium">
                    Collect via GCash QR or number. Enter the optional reference code for audit trails.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
                    GCash Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={gcashRef}
                    onChange={(e) => setGcashRef(e.target.value)}
                    placeholder="e.g. 1002 9382 1293"
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-2xl px-5 py-4 font-bold text-gray-900 dark:text-white outline-none transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
                    Customer Account Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={gcashCustomerName}
                    onChange={(e) => setGcashCustomerName(e.target.value)}
                    placeholder="e.g. Juan D."
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-2xl px-5 py-4 font-bold text-gray-900 dark:text-white outline-none transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* BANK TRANSFER VIEW */}
            {selectedMethod === 'bank_transfer' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
                    Bank Institution
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold text-gray-900 dark:text-white outline-none transition-all shadow-xs cursor-pointer"
                  >
                    {PHILIPPINE_BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
                    Transfer Reference / Confirmation Number
                  </label>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    placeholder="e.g. UB-99120349"
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold text-gray-900 dark:text-white outline-none transition-all shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* CREDIT (UTANG) VIEW */}
            {selectedMethod === 'credit' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Select Customer Account
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(true)}
                    className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    + New Customer
                  </button>
                </div>

                {/* Customer search & select */}
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customer name or phone..."
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-2xl px-5 py-3 font-medium text-sm text-gray-900 dark:text-white outline-none transition-all"
                  />

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        No customers found. Click &quot;+ New Customer&quot; above to add one.
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCustomerId(c.id)}
                          className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                            selectedCustomerId === c.id
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 shadow-xs'
                              : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200'
                          }`}
                        >
                          <div>
                            <p className="font-black text-sm text-gray-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.contact || 'No phone'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-gray-400 block">Current Balance</span>
                            <span className={`text-sm font-black ${c.totalUtang > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              ₱{c.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                        New Balance After This Credit:
                      </span>
                      <p className="text-xl font-black text-purple-900 dark:text-purple-200">
                        ₱{(selectedCustomer.totalUtang + total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                      +₱{total.toFixed(2)} Credit
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
                    Notes / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    placeholder="e.g. Due next Friday, pay upon payday"
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-2xl px-5 py-3 font-medium text-sm text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* SPLIT PAYMENT VIEW */}
            {selectedMethod === 'split' && (
              <div className="space-y-6">
                {/* Quick Split Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Quick Split Presets:</span>
                  <button
                    type="button"
                    onClick={handleSetCashCreditPreset}
                    className="px-3 py-1.5 bg-gradient-to-r from-orange-500/15 via-purple-500/15 to-purple-600/15 hover:from-orange-500/25 hover:to-purple-600/25 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Cash + Credit (Utang)</span>
                    <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Recommended</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.round((total / 2) * 100) / 100;
                      setSplitItems([
                        { id: `split-cash-${Date.now()}`, method: 'cash', amount: half },
                        { id: `split-gcash-${Date.now()}`, method: 'gcash', amount: Math.round((total - half) * 100) / 100 }
                      ]);
                    }}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Cash + GCash</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <div>
                    <h4 className="font-black text-sm text-emerald-950 dark:text-emerald-200 uppercase tracking-tight flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Split Breakdown
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      Combine cash, credit, GCash, or bank transfers.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 block">Allocated</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300">
                        ₱{splitTotalAllocated.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 block">Remaining</span>
                      <span className={`font-black ${isSplitBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₱{splitRemaining.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remaining Balance Quick Actions Bar */}
                {!isSplitBalanced && (
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    splitRemaining > 0 
                      ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`w-4 h-4 shrink-0 ${splitRemaining > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}`} />
                      <span className={`text-xs font-bold ${splitRemaining > 0 ? 'text-purple-900 dark:text-purple-200' : 'text-rose-900 dark:text-rose-200'}`}>
                        {splitRemaining > 0 
                          ? `Remaining balance of ₱${splitRemaining.toFixed(2)} to allocate:`
                          : `Over-allocated by ₱${Math.abs(splitRemaining).toFixed(2)}. Please reduce one portion.`}
                      </span>
                    </div>

                    {splitRemaining > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleAssignRemainingToCredit}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-xs flex items-center gap-1"
                        >
                          <span>+ Assign to Credit (₱{splitRemaining.toFixed(2)})</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAssignRemainingToCash}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-xs flex items-center gap-1"
                        >
                          <span>+ Assign to Cash (₱{splitRemaining.toFixed(2)})</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Split Items Rows */}
                <div className="space-y-3.5">
                  {splitItems.map((portion, idx) => (
                    <div 
                      key={portion.id}
                      className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                          Portion #{idx + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          {splitRemaining !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleAllocateRemainingToMethod(idx)}
                              className="text-[11px] font-black text-emerald-600 hover:underline cursor-pointer"
                              title="Fill remaining balance into this item"
                            >
                              + Assign Remaining
                            </button>
                          )}
                          {splitItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSplitItem(portion.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-rose-950/50 cursor-pointer"
                              title="Remove portion"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">
                            Method
                          </label>
                          <select
                            value={portion.method}
                            onChange={(e) => handleUpdateSplitItem(portion.id, { 
                              method: e.target.value as any,
                              customerId: e.target.value === 'credit' ? (customers[0]?.id || '') : undefined,
                              customerName: e.target.value === 'credit' ? (customers[0]?.name || '') : undefined,
                            })}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 font-bold text-xs uppercase text-gray-900 dark:text-white outline-none cursor-pointer"
                          >
                            <option value="cash">Cash</option>
                            <option value="credit">Credit (Utang)</option>
                            <option value="gcash">GCash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">
                            Amount (₱)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min={0}
                            value={portion.amount || ''}
                            onChange={(e) => handleUpdateSplitItem(portion.id, { 
                              amount: parseFloat(e.target.value) || 0 
                            })}
                            placeholder="0.00"
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 font-black text-sm text-gray-900 dark:text-white outline-none"
                          />
                        </div>
                      </div>

                      {/* If portion is Credit: Select customer! */}
                      {portion.method === 'credit' && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">
                              Customer to Bill Credit Portion:
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsAddingNewCustomer(true)}
                              className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
                            >
                              + New Customer
                            </button>
                          </div>
                          <select
                            value={portion.customerId || ''}
                            onChange={(e) => handleUpdateSplitItem(portion.id, { customerId: e.target.value })}
                            className="w-full bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-2 font-bold text-xs text-gray-900 dark:text-white outline-none cursor-pointer"
                          >
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} (Current Utang: ₱{c.totalUtang.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add another split button */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAddSplitItem('credit')}
                    className="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Credit Remaining
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSplitItem('cash')}
                    className="px-3 py-2 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Cash Portion
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSplitItem('gcash')}
                    className="px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add GCash Portion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 sm:p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              isSubmitting ||
              (selectedMethod === 'cash' && !isCashSufficient) ||
              (selectedMethod === 'split' && !isSplitBalanced)
            }
            onClick={handleCompletePayment}
            className="w-full sm:w-auto px-10 py-5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="animate-spin border-3 border-white/30 border-t-white rounded-full w-5 h-5" />
            ) : (
              <>
                <span>Confirm & Finalize Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Inline Add Customer Modal */}
        <AnimatePresence>
          {isAddingNewCustomer && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-800 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tight">
                    Add New Customer
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCustomer(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateCustomer} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="e.g. Maria Santos"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-bold text-sm text-gray-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">
                      Contact Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCustomerContact}
                      onChange={(e) => setNewCustomerContact(e.target.value)}
                      placeholder="0912 345 6789"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-medium text-sm text-gray-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCustomer(false)}
                      className="px-4 py-2.5 text-gray-500 font-bold text-xs uppercase rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingNewCustomer || !newCustomerName.trim()}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSavingNewCustomer ? 'Saving...' : 'Save Customer'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
