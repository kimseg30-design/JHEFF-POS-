'use client';

import React from 'react';
import { Product } from '@/lib/db/idb';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export const ProductCard = React.memo(function ProductCard({ product, onAdd }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  return (
    <button
      disabled={isOutOfStock}
      onClick={() => onAdd(product)}
      className={`group relative bg-white dark:bg-gray-900 p-4 rounded-[2rem] border-2 border-gray-200 dark:border-gray-800 hover:border-orange-500 dark:hover:border-orange-500 shadow-xs hover:shadow-md transition-all text-left flex flex-col h-full transform-gpu ${
        isOutOfStock 
          ? 'opacity-50 grayscale cursor-not-allowed' 
          : 'active:scale-95 active:bg-orange-50/50 dark:active:bg-orange-950/30 cursor-pointer'
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2 gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-orange-950 dark:text-orange-200 uppercase tracking-widest bg-orange-100 dark:bg-orange-950/90 px-2 py-1 rounded-lg border border-orange-200 dark:border-orange-800">
            {product.category}
          </span>
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
            product.stock > 10 
              ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800' 
              : 'bg-rose-100 dark:bg-rose-950/90 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800'
          }`}>
            {product.stock} IN STOCK
          </span>
        </div>
        
        <h4 className="font-black text-gray-950 dark:text-white line-clamp-2 text-base sm:text-lg leading-tight mb-1">
          {product.name}
        </h4>
        
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-sm font-black text-gray-800 dark:text-gray-200">₱</span>
          <span className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">
            {product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between w-full">
        <div className="w-full bg-gray-950 dark:bg-gray-800 text-white py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm tracking-wider uppercase group-hover:bg-orange-600 dark:group-hover:bg-orange-600 transition-colors pointer-events-none shadow-xs">
          <Plus className="w-4 h-4 stroke-[3]" />
          ADD TO CART
        </div>
      </div>
    </button>
  );
});
