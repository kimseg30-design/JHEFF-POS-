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
      bg: 'bg-orange-50',
      textColor: 'text-orange-900',
    },
    {
      title: 'Total Profit',
      value: `₱${summary.totalProfit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: LayoutDashboard,
      color: 'bg-emerald-600',
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-900',
    },
    {
      title: 'Total Expenses',
      value: `₱${(summary.totalExpenses || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: 'bg-red-600',
      bg: 'bg-red-50',
      textColor: 'text-red-900',
    },
    ...(store?.taxType === 'VAT' ? [
      {
        title: 'VAT Collected',
        value: `₱${summary.totalVatCollected.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        icon: Percent,
        color: 'bg-rose-600',
        bg: 'bg-rose-50',
        textColor: 'text-rose-900',
      },
      {
        title: 'VATable Sales',
        value: `₱${summary.totalVatableSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        icon: Percent,
        color: 'bg-amber-600',
        bg: 'bg-amber-50',
        textColor: 'text-amber-900',
      }
    ] : []),
    {
      title: 'Total Tickets',
      value: summary.totalTickets.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-600',
      bg: 'bg-blue-50',
      textColor: 'text-blue-900',
    },
    {
      title: 'E-Wallet Transactions',
      value: summary.ewalletCount.toString(),
      icon: Wallet,
      color: 'bg-indigo-600',
      bg: 'bg-indigo-50',
      textColor: 'text-indigo-900',
    },
    {
      title: 'Total Fees Earned',
      value: `₱${summary.totalFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      icon: Percent,
      color: 'bg-purple-600',
      bg: 'bg-purple-50',
      textColor: 'text-purple-900',
    },
    ...(summary.orRange ? [
      {
        title: 'OR Range',
        value: `${summary.orRange.start} - ${summary.orRange.end.split('-')[1]}`,
        icon: ShoppingBag,
        color: 'bg-slate-600',
        bg: 'bg-slate-50',
        textColor: 'text-slate-900',
      }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6 mb-12">
            <Link 
              href="/"
              className="p-4 bg-white hover:bg-gray-50 rounded-[1.5rem] transition-all text-gray-400 hover:text-gray-900 border border-gray-100 shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">Daily Summary</h2>
              <p className="text-lg text-gray-500 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
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
                className={`${card.bg} p-10 rounded-[3rem] border border-transparent hover:border-white hover:shadow-2xl transition-all flex flex-col justify-between h-full group`}
              >
                <div className={`${card.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-xl group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-gray-500 font-black text-xs uppercase tracking-widest mb-2">{card.title}</p>
                  <p className={`${card.textColor} font-black text-4xl tracking-tight`}>{card.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-gray-900 rounded-[3rem] text-white text-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600 rounded-full -mr-32 -mt-32 opacity-20 blur-3xl" />
             <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-4 relative z-10">End of Day Summary</p>
             <h3 className="text-2xl font-bold mb-8 relative z-10 tracking-tight">Great job today! Your store is performing well.</h3>
             <Link 
               href="/reports"
               className="inline-flex items-center gap-3 bg-white text-gray-900 font-black px-12 py-5 rounded-[2rem] hover:bg-gray-100 transition-all active:scale-95 uppercase tracking-widest text-sm relative z-10"
             >
               View Full Reports Dashboard
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
