'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryData } from '@/lib/hooks/use-reports';
import { motion } from 'motion/react';

interface CategoryChartProps {
  data: CategoryData[];
}

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl h-[400px] flex flex-col"
    >
      <div className="mb-6 text-center">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Sales by Category</h3>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue distribution</p>
      </div>
      
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '1.5rem', 
                border: 'none', 
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                padding: '1rem'
              }}
              formatter={(value: any) => [`₱${Number(value).toLocaleString()}`, 'Revenue']}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
