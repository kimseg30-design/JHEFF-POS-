'use client';

import { useState } from 'react';
import { useStore } from '@/lib/hooks/use-store';
import { X, Save, MapPin, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface BranchModalProps {
  onClose: () => void;
}

export function BranchModal({ onClose }: BranchModalProps) {
  const { addBranch } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Please enter the branch name.');
      return;
    }

    setIsSaving(true);
    try {
      await addBranch({
        name: formData.name.trim(),
        address: formData.address.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to add branch:', err);
      setError('Failed to add branch. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors"
      >
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-850">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-md shadow-orange-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-gray-950 dark:text-white tracking-tight">Add New Branch</h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-300 rounded-xl text-sm font-bold border border-red-200 dark:border-rose-800">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                <Home className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> Branch Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Main Branch, Cubao Outlet"
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950 transition-all outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 123 Street, Quezon City"
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950 transition-all outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider"
            >
              {isSaving ? (
                <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Branch
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
