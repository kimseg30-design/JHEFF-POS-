'use client';

import { useState, useMemo } from 'react';
import { useEWallet } from '@/lib/hooks/use-ewallet';
import { useBranches } from '@/lib/hooks/use-branches';
import { useReceipt } from '@/lib/context/receipt-context';
import { Header } from '@/components/layout/header';
import { 
  ArrowLeft, 
  Search, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  User,
  Hash,
  Filter,
  Download,
  Printer
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { EWalletTransaction } from '@/lib/db/idb';

export default function EWalletHistoryPage() {
  const { currentBranchId, currentBranch } = useBranches();
  const { transactions, loading } = useEWallet(currentBranchId || undefined);
  const { showReceipt } = useReceipt();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cash_in' | 'cash_out'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<EWalletTransaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = 
        t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.method.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || t.type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, filterType]);

  const stats = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === 'cash_in') {
        acc.totalCashIn += t.amount;
      } else {
        acc.totalCashOut += t.amount;
      }
      acc.totalFees += t.fee || 0;
      return acc;
    }, { totalCashIn: 0, totalCashOut: 0, totalFees: 0 });
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-8 mb-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Link 
                  href="/pos"
                  className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-gray-900 border border-gray-100 shadow-sm"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">E-Wallet History</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Track cash-in and cash-out services</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 rounded-2xl transition-all text-gray-900 border border-gray-100 shadow-sm font-black text-xs uppercase tracking-widest">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Cash In</p>
                <h3 className="text-3xl font-black text-green-600">₱{stats.totalCashIn.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Cash Out</p>
                <h3 className="text-3xl font-black text-orange-600">₱{stats.totalCashOut.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fees Earned</p>
                <h3 className="text-3xl font-black text-blue-600">₱{stats.totalFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h3>
              </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by customer, reference, or method..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg font-medium"
                />
              </div>
              
              <div className="flex items-center gap-2">
                {(['all', 'cash_in', 'cash_out'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
                      filterType === type
                        ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="animate-spin border-4 border-blue-100 border-t-blue-600 rounded-full w-12 h-12 mb-4" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-inner">
              <Wallet className="w-20 h-20 text-gray-100 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">No transactions found</h3>
              <p className="text-gray-400 mt-2 font-medium">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl ${
                      t.type === 'cash_in' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {t.type === 'cash_in' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          t.type === 'cash_in' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {t.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">
                          {t.method}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-gray-900">₱{t.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase">{format(t.createdAt, 'MMM dd, yyyy • hh:mm a')}</span>
                        </div>
                        {t.customerName && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <User className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase">{t.customerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fee Earned</p>
                        <p className="text-lg font-black text-blue-600">₱{(t.fee || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <button 
                        onClick={() => {
                          showReceipt({
                            ticketNumber: t.id.slice(0, 8).toUpperCase(),
                            timestamp: t.createdAt,
                            items: [],
                            total: t.amount,
                            paymentMethod: 'e-wallet',
                            type: 'ewallet',
                            ewalletDetails: {
                              type: t.type.replace('_', ' '),
                              method: t.method,
                              fee: t.fee || 0,
                              customerName: t.customerName,
                              referenceNumber: t.referenceNumber,
                            }
                          });
                        }}
                        className="p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-sm active:scale-95"
                        title="Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                    {t.referenceNumber && (
                      <div className="flex items-center gap-1 text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                        <Hash className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase">{t.referenceNumber}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
