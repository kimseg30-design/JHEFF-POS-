'use client';

import { useState } from 'react';
import { Supplier } from '@/lib/db/idb';
import { X, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function SupplierForm({ supplier, onSave, onDelete, onClose }: SupplierFormProps) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors"
      >
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-850">
          <div>
            <h3 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">
              {supplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-bold">Enter supplier contact details</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Supplier Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-gray-950 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="e.g. Coca-Cola Philippines"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-gray-950 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Name of your contact"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-gray-950 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="0917..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-gray-950 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="supplier@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-gray-950 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                rows={2}
                placeholder="Supplier office address"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            {supplier && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(supplier.id)}
                className="flex-1 bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-300 font-black py-4 rounded-2xl hover:bg-red-100 dark:hover:bg-rose-900/60 transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-rose-800 cursor-pointer"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            )}
            <button
              type="submit"
              className="flex-[2] bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
            >
              <Save className="w-5 h-5" />
              {supplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
