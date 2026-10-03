'use client';

import { TopProduct } from '@/lib/hooks/use-reports';
import { motion } from 'motion/react';
import { Package, TrendingUp } from 'lucide-react';

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col h-full"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Best Selling Products</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top 5 by revenue</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>
      
      <div className="flex-1 space-y-6">
        {products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-300">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold">No sales data yet</p>
          </div>
        ) : (
          products.map((product, index) => (
            <div key={product.name} className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-gray-900 truncate tracking-tight">{product.name}</h5>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{product.quantity} units sold</p>
              </div>
              <div className="text-right">
                <p className="font-black text-gray-900 tracking-tight">₱{product.revenue.toLocaleString()}</p>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Profit: ₱{product.profit.toLocaleString()}</p>
                <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(product.revenue / products[0].revenue) * 100}%` }}
                    className="h-full bg-orange-600"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
