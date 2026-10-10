'use client';

import { useState } from 'react';
import { useStore } from '@/lib/hooks/use-store';
import { useBranches } from '@/lib/hooks/use-branches';
import { branchService } from '@/lib/services/branch-service';
import { motion } from 'motion/react';
import { Store, ArrowRight, Loader2 } from 'lucide-react';

export function StoreSetup() {
  const { updateStore } = useStore();
  const { addBranch } = useBranches();
  const [name, setName] = useState('');
  const [taxType, setTaxType] = useState<'VAT' | 'NON-VAT'>('NON-VAT');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSaving(true);
    try {
      await updateStore(name, taxType);
      // Create initial default branch only if no branches exist
      const existingBranches = (await branchService.getAll()).filter(b => !b.isDeleted);
      if (existingBranches.length === 0) {
        await addBranch({
          name: 'JHEFF CONSTRUCTION BRANCH',
          address: 'Default Address',
          contact: 'N/A'
        });
      }
    } catch (error) {
      console.error('Setup failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none p-8 border border-gray-100 dark:border-gray-800 transition-colors"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/60 rounded-2xl flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-950 dark:text-white">Setup Your Store</h2>
          <p className="text-gray-600 dark:text-gray-300 font-bold mt-2 text-sm">Welcome to Sari-Sari POS. Let&apos;s get your business started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Store Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aling Nena's Store"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-950 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Tax Configuration
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTaxType('NON-VAT')}
                className={`p-4 rounded-xl border-2 transition-all text-sm font-black cursor-pointer ${
                  taxType === 'NON-VAT' 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                NON-VAT
              </button>
              <button
                type="button"
                onClick={() => setTaxType('VAT')}
                className={`p-4 rounded-xl border-2 transition-all text-sm font-black cursor-pointer ${
                  taxType === 'VAT' 
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                VAT (12%)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || !name}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all group shadow-lg shadow-orange-500/20 cursor-pointer uppercase tracking-wider text-xs"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Initialize Store
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8 font-black uppercase tracking-widest">
          Offline-First • Local Storage Enabled
        </p>
      </motion.div>
    </div>
  );
}
