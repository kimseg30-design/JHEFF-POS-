'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { SalesData } from '@/lib/hooks/use-reports';
import { motion } from 'motion/react';
import { Branch } from '@/lib/db/idb';

interface SalesChartProps {
  data: SalesData[];
  branches?: Branch[];
}

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export function SalesChart({ data, branches }: SalesChartProps) {
  const showBranchBreakdown = branches && branches.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl h-[400px] flex flex-col"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Sales Over Time</h3>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {showBranchBreakdown ? 'Daily revenue by branch' : 'Daily revenue performance'}
        </p>
      </div>
      
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
              tickFormatter={(value) => `₱${value}`}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ 
                borderRadius: '1.5rem', 
                border: 'none', 
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                padding: '1rem'
              }}
              formatter={(value: any, name: any) => {
                const branch = branches?.find(b => b.id === String(name));
                const displayName = branch?.name || (String(name) === 'amount' ? 'Total' : String(name));
                return [`₱${Number(value).toLocaleString()}`, displayName];
              }}
            />
            {showBranchBreakdown && (
              <Legend 
                verticalAlign="top" 
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                formatter={(value: any) => branches.find(b => b.id === String(value))?.name || String(value)}
              />
            )}
            
            {showBranchBreakdown ? (
              branches.map((branch, index) => (
                <Bar 
                  key={branch.id} 
                  dataKey={branch.id} 
                  stackId="a" 
                  fill={COLORS[index % COLORS.length]} 
                  radius={index === branches.length - 1 ? [10, 10, 0, 0] : [0, 0, 0, 0]}
                />
              ))
            ) : (
              <Bar dataKey="amount" radius={[10, 10, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#ea580c' : '#3b82f6'} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
