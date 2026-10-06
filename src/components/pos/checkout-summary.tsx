'use client';

import { Receipt, Coins } from 'lucide-react';
import { motion } from 'motion/react';

interface CheckoutSummaryProps {
  total: number;
  itemCount: number;
  onCheckout: () => void;
  disabled: boolean;
  isCheckingOut: boolean;
}

export function CheckoutSummary({ total, itemCount, onCheckout, disabled, isCheckingOut }: CheckoutSummaryProps) {
  return (
    <div className="p-6 md:p-8 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-6 shadow-2xl rounded-t-[3rem] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-xl text-gray-400 dark:text-gray-500">
            <Coins className="w-4 h-4" />
          </div>
          <span className="text-gray-500 dark:text-gray-400 font-black text-xs uppercase tracking-widest">Subtotal ({itemCount} items)</span>
        </div>
        <span className="text-gray-900 dark:text-white font-black text-xl tracking-tight">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
      </div>
      
      <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
        <span className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Total Due</span>
        <div className="text-right">
          <span className="text-4xl md:text-5xl font-black text-orange-600 dark:text-orange-400 tracking-tighter">
            ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Inclusive of all taxes</p>
        </div>
      </div>

      <motion.button
        whileTap={!disabled ? { scale: 0.96 } : {}}
        onClick={onCheckout}
        disabled={disabled}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white font-black py-5 md:py-6 rounded-[2rem] flex items-center justify-center gap-3 md:gap-4 shadow-xl shadow-orange-500/20 dark:shadow-none transition-all text-lg md:text-xl tracking-tight cursor-pointer disabled:cursor-not-allowed"
      >
        {isCheckingOut ? (
          <span className="animate-spin border-4 border-white/30 border-t-white rounded-full w-7 h-7" />
        ) : (
          <>
            <Receipt className="w-6 h-6 md:w-7 md:h-7" />
            COMPLETE CHECKOUT
          </>
        )}
      </motion.button>
    </div>
  );
}
