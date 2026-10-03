'use client';

import React from 'react';
import { TransactionItem } from '@/lib/db/idb';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: TransactionItem;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItem = React.memo(function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex-1 min-w-0">
        <h5 className="font-black text-gray-900 truncate text-lg tracking-tight leading-tight">
          {item.name}
        </h5>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-bold text-gray-400">₱{item.price.toFixed(2)} / unit</span>
          <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            ₱{(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
        <button 
          type="button"
          onClick={() => onUpdateQuantity(item.productId, -1)}
          className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-90"
        >
          <Minus className="w-4 h-4 text-gray-400" />
        </button>
        <span className="w-10 text-center font-black text-gray-900 text-lg">{item.quantity}</span>
        <button 
          type="button"
          onClick={() => onUpdateQuantity(item.productId, 1)}
          className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-90"
        >
          <Plus className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <button 
        type="button"
        onClick={() => onRemove(item.productId)}
        className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
});
