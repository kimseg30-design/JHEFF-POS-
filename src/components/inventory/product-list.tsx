'use client';

import { Product } from '@/lib/db/idb';
import { Edit2, Trash2, Package, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductListProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No products yet</h3>
        <p className="text-gray-500 mt-1">Start adding items to your inventory.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
              {product.category}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={() => onEdit(product)}
                  className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(product.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <h4 className="text-lg font-bold text-gray-900 mb-1 truncate pr-12">
            {product.name}
          </h4>
          <p className="text-2xl font-black text-orange-600 mb-4">
            ₱{product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-sm font-bold text-gray-500">
                {product.stock} in stock
              </span>
            </div>
            {product.stock <= 5 && (
              <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase">
                <AlertCircle className="w-3 h-3" /> Low Stock
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
