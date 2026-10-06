'use client';

import { useState, useEffect } from 'react';
import { Customer } from '@/lib/db/idb';
import { X, Save, User, Phone } from 'lucide-react';
import { motion } from 'motion/react';

interface CustomerFormProps {
  customer?: Customer | null;
  onSave: (customer: any) => Promise<void>;
  onClose: () => void;
}

export function CustomerForm({ customer, onSave, onClose }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        contact: customer.contact,
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Please enter the customer name.');
      return;
    }

    setIsSaving(true);
    try {
      if (customer?.id) {
        await onSave({ ...customer, ...formData, name: formData.name.trim() });
      } else {
        await onSave({ ...formData, name: formData.name.trim() });
      }
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      setError('Failed to save customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors"
      >
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2.5 rounded-2xl text-white shadow-md shadow-green-600/20">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-gray-950 dark:text-white uppercase tracking-tight">
              {customer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-rose-950/50 text-red-700 dark:text-rose-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-200 dark:border-rose-900/60">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                <User className="w-3.5 h-3.5 text-green-600" /> Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-green-600 focus:ring-4 focus:ring-green-500/10 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Contact Number
              </label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="e.g. 0912 345 6789"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-green-600 focus:ring-4 focus:ring-green-500/10 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
              className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 transition-all text-xs uppercase tracking-widest cursor-pointer"
            >
              {isSaving ? (
                <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {customer ? 'Update Customer' : 'Save Customer'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
