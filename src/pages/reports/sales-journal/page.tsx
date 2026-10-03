'use client';

import { useState, useMemo } from 'react';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useStore } from '@/lib/hooks/use-store';
import { Header } from '@/components/layout/header';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Download,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import Papa from 'papaparse';

export default function SalesJournalPage() {
  const { transactions, loading } = useTransactions();
  const { store } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => !t.isDeleted)
      .filter(t => {
        const date = new Date(t.timestamp);
        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));
        return isWithinInterval(date, { start, end });
      })
      .filter(t => 
        t.orNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, startDate, endDate, searchQuery]);

  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => ({
      totalSales: acc.totalSales + t.total,
      vatAmount: acc.vatAmount + (t.vatAmount || 0),
      netSales: acc.netSales + (t.vatableSales || (t.total - (t.vatAmount || 0))),
    }), { totalSales: 0, vatAmount: 0, netSales: 0 });
  }, [filteredTransactions]);

  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
      Date: format(t.timestamp, 'yyyy-MM-dd'),
      'OR Number': t.orNumber || 'N/A',
      'Total Sales': t.total.toFixed(2),
      VAT: (t.vatAmount || 0).toFixed(2),
      'Net Sales': (t.vatableSales || (t.total - (t.vatAmount || 0))).toFixed(2)
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = format(new Date(), 'yyyy-MM-dd');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/reports"
                className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-gray-900 border border-gray-100 shadow-sm"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Sales Journal</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">BIR Compliance Report</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold p-1"
                />
                <span className="text-gray-300">to</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold p-1"
                />
              </div>
              
              <button
                onClick={handleExport}
                className="bg-gray-900 text-white font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search OR Number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Journal Table */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-r border-gray-800">Date</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-r border-gray-800">OR Number</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-r border-gray-800 text-right">Total Sales</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest border-r border-gray-800 text-right">VAT Amount</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">Net Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Journal...</p>
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-32 text-center">
                        <FileText className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No transactions found for this period</p>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4 font-medium text-gray-600 border-r border-gray-50">
                            {format(t.timestamp, 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 border-r border-gray-50">
                            <span className="font-black text-gray-900">{t.orNumber || 'N/A'}</span>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{t.ticketNumber}</p>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900 border-r border-gray-50">
                            ₱{t.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-orange-600 border-r border-gray-50">
                            ₱{(t.vatAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-black text-gray-900">
                            ₱{(t.vatableSales || (t.total - (t.vatAmount || 0))).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {/* Summary Footer */}
                      <tr className="bg-gray-50/80 font-black">
                        <td colSpan={2} className="px-6 py-6 text-right uppercase tracking-widest text-xs text-gray-500">
                          Totals for Period
                        </td>
                        <td className="px-6 py-6 text-right text-xl text-gray-900 border-r border-gray-100">
                          ₱{totals.totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-6 text-right text-xl text-orange-600 border-r border-gray-100">
                          ₱{totals.vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-6 text-right text-xl text-emerald-600">
                          ₱{totals.netSales.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BIR Compliance Note */}
          <div className="mt-8 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4">
            <div className="bg-blue-600 p-2 rounded-lg text-white mt-1">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-blue-900 uppercase tracking-tight text-sm mb-1">BIR Compliance Note</h4>
              <p className="text-blue-800/70 text-xs font-medium leading-relaxed">
                This Sales Journal is generated based on your recorded transactions in this POS system. 
                Ensure all Official Receipts (OR) are properly issued and recorded. 
                For BIR audit purposes, you may export this data as CSV and maintain a printed copy if required by your RDO.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
