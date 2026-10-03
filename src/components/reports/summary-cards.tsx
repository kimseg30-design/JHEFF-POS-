'use client';

import { TrendingUp, ShoppingBag, Users, CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, Percent } from 'lucide-react';
import { motion } from 'motion/react';

interface SummaryCardsProps {
  totalSales: number;
  totalProfit: number;
  totalExpenses?: number;
  totalTransactions: number;
  totalUtang: number;
  totalCashIn?: number;
  totalCashOut?: number;
  totalEwalletFees?: number;
  totalVatCollected?: number;
  totalVatableSales?: number;
  taxType?: 'VAT' | 'NON-VAT';
  orRange?: { start: string; end: string } | null;
}

export function SummaryCards({ 
  totalSales, 
  totalProfit,
  totalExpenses = 0,
  totalTransactions, 
  totalUtang,
  totalCashIn = 0,
  totalCashOut = 0,
  totalEwalletFees = 0,
  totalVatCollected = 0,
  totalVatableSales = 0,
  taxType = 'NON-VAT',
  orRange = null
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Sales',
      value: `₱${totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'bg-orange-600',
      bg: 'bg-orange-50',
      textColor: 'text-orange-900',
    },
    {
      title: 'Total Profit',
      value: `₱${totalProfit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: ArrowUpRight,
      color: 'bg-emerald-600',
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-900',
    },
    {
      title: 'Total Expenses',
      value: `₱${totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: ArrowDownLeft,
      color: 'bg-red-600',
      bg: 'bg-red-50',
      textColor: 'text-red-900',
    },
    {
      title: 'Transactions',
      value: totalTransactions.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-600',
      bg: 'bg-blue-50',
      textColor: 'text-blue-900',
    },
    {
      title: 'Total Utang',
      value: `₱${totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: Users,
      color: 'bg-red-600',
      bg: 'bg-red-50',
      textColor: 'text-red-900',
    },
    {
      title: 'E-Wallet Fees',
      value: `₱${totalEwalletFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'bg-green-600',
      bg: 'bg-green-50',
      textColor: 'text-green-900',
    },
    ...(taxType === 'VAT' ? [
      {
        title: 'VAT Collected',
        value: `₱${totalVatCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        icon: Percent,
        color: 'bg-rose-600',
        bg: 'bg-rose-50',
        textColor: 'text-rose-900',
      },
      {
        title: 'VATable Sales',
        value: `₱${totalVatableSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        icon: Percent,
        color: 'bg-amber-600',
        bg: 'bg-amber-50',
        textColor: 'text-amber-900',
      }
    ] : []),
    ...(orRange ? [
      {
        title: 'OR Range',
        value: `${orRange.start} - ${orRange.end.split('-')[1]}`,
        icon: ShoppingBag,
        color: 'bg-slate-600',
        bg: 'bg-slate-50',
        textColor: 'text-slate-900',
      }
    ] : []),
  ];

  const ewalletCards = [
    {
      title: 'Cash In Volume',
      value: `₱${totalCashIn.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: ArrowUpRight,
      color: 'bg-emerald-600',
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-900',
    },
    {
      title: 'Cash Out Volume',
      value: `₱${totalCashOut.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: ArrowDownLeft,
      color: 'bg-amber-600',
      bg: 'bg-amber-50',
      textColor: 'text-amber-900',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${card.bg} p-6 rounded-[2rem] border border-transparent hover:border-white hover:shadow-xl transition-all h-full flex flex-col justify-between`}
          >
            <div className={`${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest mb-1">{card.title}</p>
              <p className={`${card.textColor} font-black text-2xl tracking-tight`}>{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {ewalletCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 4) * 0.1 }}
            className={`${card.bg} p-6 rounded-[2rem] border border-transparent hover:border-white hover:shadow-xl transition-all h-full flex flex-col justify-between`}
          >
            <div className={`${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest mb-1">{card.title}</p>
              <p className={`${card.textColor} font-black text-2xl tracking-tight`}>{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
