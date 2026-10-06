'use client';

import { useState } from 'react';
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Loader2, Check, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { EWalletTransaction } from '@/lib/db/idb';

interface EWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<EWalletTransaction, 'id' | 'createdAt' | 'updatedAt' | 'branchId'>) => Promise<void>;
}

export function EWalletModal({ isOpen, onClose, onSave }: EWalletModalProps) {
  const [type, setType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [method, setMethod] = useState<'gcash' | 'maya' | 'bank_transfer' | 'gotyme'>('gcash');
  const [customerName, setCustomerName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        type,
        amount: parseFloat(amount),
        fee: fee ? parseFloat(fee) : 0,
        method,
        customerName: customerName || undefined,
        referenceNumber: referenceNumber || undefined,
      });
      onClose();
      // Reset form
      setAmount('');
      setFee('');
      setCustomerName('');
      setReferenceNumber('');
    } catch (error) {
      console.error('Failed to save e-wallet transaction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors"
          >
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/60">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight uppercase">E-Wallet Service</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Cash In / Cash Out</p>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <Link 
                      href="/pos/ewallet-history"
                      className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <History className="w-3 h-3" />
                      View History
                    </Link>
                  </div>
                </div>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl text-gray-700 dark:text-gray-200 transition-colors border border-gray-200 dark:border-gray-700 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType('cash_in')}
                  className={`p-6 rounded-3xl flex flex-col items-center gap-3 transition-all border-2 cursor-pointer ${
                    type === 'cash_in'
                      ? 'bg-green-50 dark:bg-emerald-950/40 border-green-600 text-green-700 dark:text-emerald-300 shadow-lg shadow-green-500/10'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <ArrowUpRight className={`w-8 h-8 ${type === 'cash_in' ? 'text-green-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                  <span className="font-black uppercase tracking-widest text-xs">Cash In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('cash_out')}
                  className={`p-6 rounded-3xl flex flex-col items-center gap-3 transition-all border-2 cursor-pointer ${
                    type === 'cash_out'
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-600 text-orange-700 dark:text-orange-300 shadow-lg shadow-orange-500/10'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <ArrowDownLeft className={`w-8 h-8 ${type === 'cash_out' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`} />
                  <span className="font-black uppercase tracking-widest text-xs">Cash Out</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-700 dark:text-gray-300">₱</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-4 bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all text-lg font-black placeholder:text-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-2">Service Fee</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-700 dark:text-gray-300">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-4 bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all text-lg font-black placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-2">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-xs cursor-pointer"
                >
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="gotyme">GoTyme</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-2">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-2">Ref Number</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!amount || isSaving}
                className="w-full bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-10 py-6 rounded-[2rem] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 uppercase text-sm tracking-widest mt-4 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Confirm Transaction
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
