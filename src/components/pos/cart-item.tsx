'use client';

import React, { useState, useEffect } from 'react';
import { TransactionItem } from '@/lib/db/idb';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: TransactionItem;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onSetQuantity?: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItem = React.memo(function CartItem({ 
  item, 
  onUpdateQuantity, 
  onSetQuantity, 
  onRemove 
}: CartItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(item.quantity));

  useEffect(() => {
    setInputValue(String(item.quantity));
  }, [item.quantity]);

  const commitValue = () => {
    setIsEditing(false);
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      if (onSetQuantity) {
        onSetQuantity(item.productId, parsed);
      } else {
        const delta = parsed - item.quantity;
        if (delta !== 0) onUpdateQuantity(item.productId, delta);
      }
    } else if (parsed === 0) {
      onRemove(item.productId);
    } else {
      setInputValue(String(item.quantity));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue();
    } else if (e.key === 'Escape') {
      setInputValue(String(item.quantity));
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-4 bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md transition-all">
      <div className="flex-1 min-w-0">
        <h5 className="font-black text-gray-950 dark:text-white truncate text-base sm:text-lg tracking-tight leading-tight">
          {item.name}
        </h5>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-black text-gray-700 dark:text-gray-300">₱{item.price.toFixed(2)} / unit</span>
          <span className="text-xs font-black text-orange-950 dark:text-orange-200 bg-orange-100 dark:bg-orange-950/90 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
            ₱{(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Adjustable Quantity Stepper & Direct Numeric Input */}
      <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 border-2 border-gray-200 dark:border-gray-700">
        <button 
          type="button"
          onClick={() => onUpdateQuantity(item.productId, -1)}
          className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs rounded-xl transition-all active:scale-90 text-gray-900 dark:text-white font-black cursor-pointer"
          title="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
        </button>

        {isEditing ? (
          <input
            type="number"
            min="1"
            max="9999"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={commitValue}
            onKeyDown={handleKeyDown}
            className="w-12 sm:w-14 text-center font-black text-gray-950 dark:text-white bg-white dark:bg-gray-900 border-2 border-orange-500 rounded-lg py-0.5 text-base sm:text-lg outline-none shadow-xs"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-10 sm:w-12 text-center font-black text-gray-950 dark:text-white text-base sm:text-lg hover:text-orange-600 dark:hover:text-orange-400 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-lg transition-colors cursor-pointer py-0.5"
            title="Click to type exact quantity"
          >
            {item.quantity}
          </button>
        )}

        <button 
          type="button"
          onClick={() => onUpdateQuantity(item.productId, 1)}
          className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 hover:shadow-xs rounded-xl transition-all active:scale-90 text-gray-900 dark:text-white font-black cursor-pointer"
          title="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
        </button>
      </div>
      
      <button 
        type="button"
        onClick={() => onRemove(item.productId)}
        className="p-2 sm:p-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/80 rounded-2xl transition-all active:scale-90 cursor-pointer shrink-0"
        title="Remove item"
      >
        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
});

