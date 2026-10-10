'use client';

import { useReports } from '@/lib/hooks/use-reports';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStore } from '@/lib/hooks/use-store';
import { Header } from '@/components/layout/header';
import { 
  Loader2, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  ShoppingBag, 
  Wallet, 
  Percent,
  Calendar,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

import { useBranches } from '@/lib/hooks/use-branches';

export default function DailySummaryPage() {
  const { currentBranchId } = useBranches();
  const { loading, getDailySummary } = useReports(currentBranchId || undefined);
  const { isCashier } = useAuth();
  const { store } = useStore();

  const summary = getDailySummary();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Sales',
      value: `₱${summary.totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'bg-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40',
      textColor: 'text-orange-950 dark:text-orange-200',
    },
    {
      title: 'Total Profit',
      value: `₱${summary.totalProfit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: LayoutDashboard,
      color: 'bg-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40',
      textColor: 'text-emerald-950 dark:text-emerald-200',
    },
    {
      title: 'Total Expenses',
      value: `₱${(summary.totalExpenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'bg-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40',
      textColor: 'text-red-950 dark:text-red-200',
    },
    ...(store?.taxType === 'VAT' ? [
      {
        title: 'VAT Collected',
        value: `₱${summary.totalVatCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        icon: Percent,
        color: 'bg-rose-600',
        bg: 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40',
        textColor: 'text-rose-950 dark:text-rose-200',
      },
      {
        title: 'VATable Sales',
        value: `₱${summary.totalVatableSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        icon: Percent,
        color: 'bg-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40',
        textColor: 'text-amber-950 dark:text-amber-200',
      }
    ] : []),
    {
      title: 'Total Tickets',
      value: summary.totalTickets.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40',
      textColor: 'text-blue-950 dark:text-blue-200',
    },
    {
      title: 'E-Wallet Transactions',
      value: summary.ewalletCount.toString(),
      icon: Wallet,
      color: 'bg-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40',
      textColor: 'text-indigo-950 dark:text-indigo-200',
    },
    {
      title: 'Total Fees Earned',
      value: `₱${summary.totalFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: Percent,
      color: 'bg-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40',
      textColor: 'text-purple-950 dark:text-purple-200',
    },
    ...(summary.orRange ? [
      {
        title: 'OR Range',
        value: `${summary.orRange.start} - ${summary.orRange.end.split('-')[1]}`,
        icon: ShoppingBag,
        color: 'bg-slate-600',
        bg: 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800',
        textColor: 'text-slate-950 dark:text-slate-200',
      }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans transition-colors">
      <Header />
      
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-12">
            <Link 
              href="/"
              className="p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-[1.5rem] transition-all text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white border border-gray-200 dark:border-gray-800 shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h2 className="text-4xl font-black text-gray-950 dark:text-white tracking-tighter leading-tight">Daily Summary</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${card.bg} p-10 rounded-[3rem] hover:shadow-2xl transition-all flex flex-col justify-between h-full group`}
              >
                <div className={`${card.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-xl group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-black text-xs uppercase tracking-widest mb-2">{card.title}</p>
                  <p className={`${card.textColor} font-black text-4xl tracking-tight`}>{card.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-gray-950 dark:bg-gray-900 border border-gray-800 rounded-[3rem] text-white text-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600 rounded-full -mr-32 -mt-32 opacity-20 blur-3xl" />
             <p className="text-orange-400 font-black text-xs uppercase tracking-widest mb-4 relative z-10">End of Day Summary</p>
             <h3 className="text-2xl font-black mb-8 relative z-10 tracking-tight">Great job today! Your store is performing well.</h3>
             <Link 
               href="/reports"
               className="inline-flex items-center gap-3 bg-white text-gray-950 font-black px-12 py-5 rounded-[2rem] hover:bg-gray-100 transition-all active:scale-95 uppercase tracking-widest text-sm relative z-10 cursor-pointer shadow-lg"
             >
               View Full Reports Dashboard
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
