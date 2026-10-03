'use client';

import { CheckCircle2, Receipt as ReceiptIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuccessOverlayProps {
  show: boolean;
  onClose: () => void;
  onViewReceipt?: () => void;
  title: string;
  message: string;
  ticketNumber?: string;
}

export function SuccessOverlay({ show, onClose, onViewReceipt, title, message, ticketNumber }: SuccessOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-orange-600/95 backdrop-blur-xl z-[200] flex flex-col items-center justify-center text-white p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="bg-white p-10 rounded-[3rem] mb-10 shadow-2xl"
          >
            <CheckCircle2 className="w-32 h-32 text-orange-600" />
          </motion.div>
          
          <h2 className="text-6xl font-black mb-4 tracking-tighter uppercase">{title}</h2>
          <p className="text-2xl font-medium opacity-90 max-w-md mb-4">{message}</p>
          
          {ticketNumber && (
            <div className="bg-white/10 px-8 py-4 rounded-3xl border border-white/20 mb-8">
              <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest mb-1">Ticket Number</p>
              <p className="text-4xl font-black tracking-tighter">{ticketNumber}</p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button 
              onClick={onClose}
              className="px-10 py-5 bg-white text-orange-600 font-black rounded-[2rem] shadow-xl hover:bg-orange-50 transition-all uppercase tracking-widest text-sm active:scale-95"
            >
              Continue
            </button>
            
            {onViewReceipt && (
              <button 
                onClick={onViewReceipt}
                className="px-10 py-5 bg-orange-700 text-white font-black rounded-[2rem] shadow-xl hover:bg-orange-800 transition-all uppercase tracking-widest text-sm flex items-center gap-3 border border-orange-500/30 active:scale-95"
              >
                <ReceiptIcon className="w-5 h-5" />
                View Receipt
              </button>
            )}
          </div>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 5 }}
            className="h-1 bg-white/30 mt-12 max-w-xs rounded-full overflow-hidden"
          >
            <div className="h-full bg-white w-full" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
