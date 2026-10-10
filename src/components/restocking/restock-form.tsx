'use client';

import { useState, useMemo } from 'react';
import { Product, Supplier, RestockItem } from '@/lib/db/idb';
import { X, Plus, Trash2, Search, Save, Package, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RestockFormProps {
  products: Product[];
  suppliers: Supplier[];
  onSave: (supplierId: string, items: RestockItem[], totalCost: number, referenceNumber?: string, notes?: string) => void;
  onClose: () => void;
}

export function RestockForm({ products, suppliers, onSave, onClose }: RestockFormProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [restockItems, setRestockItems] = useState<RestockItem[]>([]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery]
  );

  const totalCost = useMemo(() => 
    restockItems.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0),
    [restockItems]
  );

  const addItem = (product: Product) => {
    if (restockItems.find(item => item.productId === product.id)) return;
    setRestockItems([...restockItems, {
      productId: product.id,
      name: product.name,
      quantity: 1,
      costPrice: 0
    }]);
  };

  const removeItem = (productId: string) => {
    setRestockItems(restockItems.filter(item => item.productId !== productId));
  };

  const updateItem = (productId: string, field: keyof RestockItem, value: any) => {
    setRestockItems(restockItems.map(item => 
      item.productId === productId ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || restockItems.length === 0) return;
    onSave(selectedSupplierId, restockItems, totalCost, referenceNumber, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-850">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Record Restock</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-bold">Add items to your inventory</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Side: Product Selector */}
          <div className="w-full md:w-1/3 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/30 dark:bg-gray-950/40">
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-950 dark:text-white rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-xs focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-750 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-lg transition-all text-left group cursor-pointer"
                >
                  <div>
                    <p className="font-black text-gray-950 dark:text-white leading-tight">{product.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest mt-1">Stock: {product.stock}</p>
                  </div>
                  <Plus className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Restock List */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Supplier *</label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-gray-950 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select a supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Reference Number</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Invoice or Receipt #"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-gray-950 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mb-8 pr-2">
                <table className="w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Product</th>
                      <th className="px-4 text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest w-24 text-center">Qty</th>
                      <th className="px-4 text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest w-32">Cost/Unit</th>
                      <th className="px-4 text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest w-32 text-right">Subtotal</th>
                      <th className="px-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {restockItems.map(item => (
                        <motion.tr
                          key={item.productId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-gray-50/70 dark:bg-gray-800/60 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
                        >
                          <td className="px-4 py-4 rounded-l-2xl">
                            <p className="font-black text-gray-950 dark:text-white">{item.name}</p>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-950 dark:text-white rounded-xl px-3 py-2 text-center font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.costPrice}
                              onChange={(e) => updateItem(item.productId, 'costPrice', parseFloat(e.target.value) || 0)}
                              className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-950 dark:text-white rounded-xl px-3 py-2 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="font-black text-gray-950 dark:text-white">₱{(item.quantity * item.costPrice).toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-4 rounded-r-2xl text-right">
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {restockItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="bg-gray-50 dark:bg-gray-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
                            <Package className="w-8 h-8" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 font-bold">Select products from the left to restock</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-auto pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
                <div className="w-full md:w-1/2">
                  <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={1}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-950 dark:text-white rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all resize-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Optional notes about this restock..."
                  />
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest leading-none mb-1">Total Cost</p>
                    <p className="text-4xl font-black text-gray-950 dark:text-white tracking-tighter">₱{totalCost.toLocaleString()}</p>
                  </div>
                  <button
                    type="submit"
                    disabled={restockItems.length === 0 || !selectedSupplierId}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-6 rounded-[2rem] shadow-2xl shadow-indigo-500/20 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center gap-3 cursor-pointer"
                  >
                    <Save className="w-5 h-5" />
                    Complete Restock
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
