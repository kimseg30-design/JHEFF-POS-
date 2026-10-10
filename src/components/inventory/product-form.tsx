'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/db/idb';
import { X, Save, Package, Tag, Hash, Coins, MapPin, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useBranches } from '@/lib/hooks/use-branches';

interface ProductFormProps {
  product?: Product | null;
  onSave: (product: any) => Promise<void>;
  onClose: () => void;
}

export function ProductForm({ product, onSave, onClose }: ProductFormProps) {
  const { branches, currentBranchId } = useBranches();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    category: '',
    barcode: '',
    branchId: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        cost: (product.cost || 0).toString(),
        stock: product.stock.toString(),
        minStock: product.minStock !== undefined ? product.minStock.toString() : '',
        category: product.category,
        barcode: product.barcode || '',
        branchId: product.branchId,
      });
    } else if (currentBranchId) {
      setFormData(prev => ({ ...prev, branchId: currentBranchId, minStock: '' }));
    }
  }, [product, currentBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId) {
      alert('Please select a branch.');
      return;
    }
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock),
        minStock: formData.minStock ? parseInt(formData.minStock, 10) : undefined,
      };
      if (product?.id) {
        await onSave({ ...data, id: product.id, createdAt: product.createdAt });
      } else {
        await onSave(data);
      }
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors"
      >
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2.5 rounded-2xl text-white shadow-md shadow-orange-500/20">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-gray-950 dark:text-white uppercase tracking-tight">
              {product ? 'Edit Product' : 'Add New Product'}
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
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                <Tag className="w-3.5 h-3.5 text-orange-500" /> Product Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Coca-Cola 1.5L"
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                  <Coins className="w-3.5 h-3.5 text-emerald-500" /> Cost (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                  <Coins className="w-3.5 h-3.5 text-orange-500" /> Price (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                  Category
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all cursor-pointer"
                >
                  <option value="">Select...</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Canned Goods">Canned Goods</option>
                  <option value="Essentials">Essentials</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> Branch
                </label>
                <select
                  required
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all cursor-pointer"
                >
                  <option value="">Select Branch...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                  <Hash className="w-3.5 h-3.5 text-blue-500" /> Stock Qty
                </label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Min Stock Alert
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">
                  Barcode (Optional)
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan or type..."
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-bold focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
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
              className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all text-xs uppercase tracking-widest cursor-pointer"
            >
              {isSaving ? (
                <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {product ? 'Update Product' : 'Save Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
