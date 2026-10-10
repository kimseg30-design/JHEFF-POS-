'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '@/lib/db/idb';
import { Edit2, Trash2, Package, AlertCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductListProps {
  products: Product[];
  lowStockThreshold?: number;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

const ITEMS_PER_PAGE = 20; // 5 columns x 4 rows pagination

export function ProductList({ products, lowStockThreshold = 10, onEdit, onDelete }: ProductListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if total product list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return products.slice(start, start + ITEMS_PER_PAGE);
  }, [products, currentPage]);

  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-16 text-center border border-dashed border-gray-300 dark:border-gray-800 shadow-sm transition-colors">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-xl font-black text-gray-950 dark:text-white uppercase tracking-tight">No products yet</h3>
        <p className="text-gray-600 dark:text-gray-300 font-medium mt-1">Start adding items to your inventory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 5 columns x 4 rows Inventory Display Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {paginatedProducts.map((product, index) => {
          const effectiveThreshold = product.minStock !== undefined && product.minStock > 0 ? product.minStock : lowStockThreshold;
          const isOutOfStock = product.stock <= 0;
          const isLowStock = !isOutOfStock && product.stock <= effectiveThreshold;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`rounded-3xl p-5 border-2 shadow-xs hover:shadow-md transition-all group relative flex flex-col justify-between ${
                isOutOfStock
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/80 hover:border-rose-400'
                  : isLowStock
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/80 hover:border-amber-400 ring-1 ring-amber-400/20'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="bg-orange-100 dark:bg-orange-950/80 text-orange-900 dark:text-orange-200 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md line-clamp-1 border border-orange-200 dark:border-orange-800">
                    {product.category}
                  </span>
                  <div className="flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity shrink-0">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-300 rounded-lg hover:bg-red-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h4 className="text-base font-black text-gray-950 dark:text-white mb-1.5 line-clamp-2 leading-tight">
                  {product.name}
                </h4>
                <p className="text-xl font-black text-orange-600 dark:text-orange-400 mb-3">
                  ₱{product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-2 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      isOutOfStock 
                        ? 'bg-rose-600' 
                        : isLowStock 
                        ? 'bg-amber-500 animate-ping' 
                        : 'bg-emerald-500'
                    }`} />
                    <span className={`text-xs font-black ${
                      isOutOfStock
                        ? 'text-rose-700 dark:text-rose-300'
                        : isLowStock
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {product.stock} in stock
                    </span>
                  </div>

                  {product.minStock !== undefined && product.minStock > 0 && (
                    <span className="text-[10px] font-extrabold text-gray-600 dark:text-gray-400" title="Custom threshold for this item">
                      Min: {product.minStock}
                    </span>
                  )}
                </div>

                {/* Low Stock or Out of Stock Alert Badge */}
                {isOutOfStock ? (
                  <div className="flex items-center justify-center gap-1.5 w-full bg-rose-100 dark:bg-rose-950/90 text-rose-950 dark:text-rose-200 text-[11px] font-black px-2 py-1.5 rounded-xl uppercase tracking-wider border border-rose-300 dark:border-rose-800 shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                    <span>Out of Stock</span>
                  </div>
                ) : isLowStock ? (
                  <div className="flex items-center justify-center gap-1.5 w-full bg-amber-100 dark:bg-amber-950/90 text-amber-950 dark:text-amber-200 text-[11px] font-black px-2 py-1.5 rounded-xl uppercase tracking-wider border-2 border-amber-400 dark:border-amber-700 shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                    <span>Low Stock (≤{effectiveThreshold})</span>
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 5x4 Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Showing <span className="text-orange-600 dark:text-orange-400 font-black">{(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, products.length)}</span> of <span className="text-gray-950 dark:text-white font-black">{products.length}</span> products · <span className="text-gray-500 dark:text-gray-400 font-bold">5×4 Display (Page {currentPage} of {totalPages})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 rounded-xl font-black text-xs uppercase flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-gray-400 font-black">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-9 h-9 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 rounded-xl font-black text-xs uppercase flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

