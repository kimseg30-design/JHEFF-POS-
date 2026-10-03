'use client';

import { useState, useRef } from 'react';
import { Plus, Zap, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickAddProps {
  onAdd: (name: string, price: number) => Promise<void>;
}

export function QuickAdd({ onAdd }: QuickAddProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const pricePresets = [5, 10, 20, 50, 100];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || isSubmitting) return;

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) return;

    setIsSubmitting(true);
    try {
      await onAdd(name || 'Quick Item', numericPrice);
      setName('');
      setPrice('');
      setIsOpen(false);
    } catch (error) {
      console.error('Quick add failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetClick = (preset: number) => {
    setPrice(preset.toString());
    if (!name) {
      setName(`Item ₱${preset}`);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => nameInputRef.current?.focus(), 200);
        }}
        className="bg-orange-600 text-white p-4 rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:bg-orange-700 transition-all"
      >
        <Zap className="w-6 h-6 fill-current" />
        <span className="hidden md:inline font-black text-sm uppercase tracking-widest">Quick Add</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-lg shadow-orange-100">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Quick Add</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instant item creation</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-3 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Price Presets</label>
                    <div className="flex flex-wrap gap-2">
                      {pricePresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handlePresetClick(preset)}
                          className="flex-1 min-w-[60px] py-3 bg-orange-50 text-orange-600 rounded-xl font-black text-sm hover:bg-orange-100 transition-colors border border-orange-100"
                        >
                          ₱{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Item Name (Optional)</label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="e.g. Ice Candy"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-orange-500/10 outline-none text-lg font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1">Price (₱)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-orange-500/10 outline-none text-xl font-black transition-all"
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isSubmitting || !name || !price}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl shadow-orange-200 transition-all text-xl tracking-tight"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-8 h-8" />
                      ADD TO CART
                    </>
                  )}
                </motion.button>
                
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">
                  Automatically adds to inventory & cart
                </p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
