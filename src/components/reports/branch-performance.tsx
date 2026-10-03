'use client';

import { motion } from 'motion/react';
import { MapPin, TrendingUp, ShoppingCart, CreditCard } from 'lucide-react';
import { Branch } from '@/lib/db/idb';

interface BranchStats {
  id: string;
  sales: number;
  transactions: number;
  utang: number;
}

interface BranchPerformanceProps {
  stats: BranchStats[];
  branches: Branch[];
}

export function BranchPerformance({ stats, branches }: BranchPerformanceProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl"
    >
      <div className="mb-10">
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">Branch Performance</h3>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Comparison across all locations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const branch = branches.find(b => b.id === stat.id);
          const name = branch?.name || 'Unknown Branch';
          
          return (
            <div 
              key={stat.id}
              className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 hover:border-orange-200 transition-all group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 tracking-tight">{name}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{branch?.address || 'No address'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>Sales</span>
                  </div>
                  <span className="font-black text-gray-900">₱{stat.sales.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Trans.</span>
                  </div>
                  <span className="font-black text-gray-900">{stat.transactions}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                    <CreditCard className="w-4 h-4" />
                    <span>Utang</span>
                  </div>
                  <span className="font-black text-red-600">₱{stat.utang.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
