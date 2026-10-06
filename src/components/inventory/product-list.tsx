'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '@/lib/db/idb';
import { Edit2, Trash2, Package, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductListProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

const ITEMS_PER_PAGE = 20; // 5 columns x 4 rows pagination

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
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
        {paginatedProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-5 border-2 border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all group relative flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-3">
                <span className="bg-orange-100 dark:bg-orange-950/80 text-orange-900 dark:text-orange-200 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md line-clamp-1">
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

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-2">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                  {product.stock} in stock
                </span>
              </div>
              {product.stock <= 5 && (
                <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                  <AlertCircle className="w-3 h-3" /> Low
                </div>
              )}
            </div>
          </motion.div>
        ))}
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

