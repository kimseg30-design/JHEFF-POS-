'use client';

import { useState, useEffect } from 'react';
import { useReports } from '@/lib/hooks/use-reports';
import { useBranches } from '@/lib/hooks/use-branches';
import { useAuth } from '@/lib/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { SummaryCards } from '@/components/reports/summary-cards';
import { SalesChart } from '@/components/reports/sales-chart';
import { CategoryChart } from '@/components/reports/category-chart';
import { TopProducts } from '@/components/reports/top-products';
import { BranchPerformance } from '@/components/reports/branch-performance';
import { 
  BarChart3, 
  Calendar, 
  ArrowLeft, 
  Loader2, 
  Download,
  Filter,
  ShieldAlert,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/lib/hooks/use-store';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function ReportsPage() {
  const { branches, currentBranchId, loading: loadingBranches } = useBranches();
  const { isCashier, loading: authLoading } = useAuth();
  const { store } = useStore();
  const router = useRouter();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const { loading, transactions, getFilteredStats } = useReports(selectedBranchId === 'all' ? undefined : selectedBranchId);
  const [timeRange, setTimeRange] = useState(7); // Default 7 days

  useEffect(() => {
    if (!authLoading && isCashier) {
      router.push('/');
    }
  }, [isCashier, authLoading, router]);

  const stats = getFilteredStats(timeRange);

  const handleExport = () => {
    const now = Date.now();
    const cutoff = now - timeRange * 24 * 60 * 60 * 1000;
    const filtered = transactions
      .filter(t => !t.isDeleted && t.timestamp >= cutoff)
      .sort((a, b) => b.timestamp - a.timestamp);

    const exportData = filtered.map(t => ({
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

  if (loading || authLoading || loadingBranches) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!currentBranchId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600">
              <BarChart3 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-4">No Branch Access</h2>
            <p className="text-gray-500 font-medium leading-relaxed mb-8">
              You haven&apos;t been assigned to any branches yet. Please contact your administrator to get access.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isCashier) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="bg-red-100 p-6 rounded-[2.5rem] mb-8 text-red-600 shadow-xl shadow-red-100">
          <ShieldAlert className="w-16 h-16" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">Access Denied</h2>
        <p className="text-xl text-gray-500 font-medium mb-12 max-w-md">
          You do not have permission to view reports. Please contact your administrator.
        </p>
        <Link 
          href="/"
          className="bg-gray-900 text-white font-black px-12 py-6 rounded-[2rem] shadow-2xl hover:bg-black transition-all active:scale-95 uppercase tracking-widest text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header />
        
        <div className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-6">
                <Link 
                  href="/"
                  className="p-4 bg-white hover:bg-gray-50 rounded-[1.5rem] transition-all text-gray-400 hover:text-gray-900 border border-gray-100 shadow-sm"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">Reports Dashboard</h2>
                  <p className="text-lg text-gray-500 font-medium">Analyze your store performance and sales trends.</p>
                </div>
              </div>
  
              <div className="flex flex-wrap items-center gap-4">
                {/* Branch Filter */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="pl-4 pr-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                  </div>
                  <select 
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-gray-900 pr-4 cursor-pointer"
                  >
                    <option value="all">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
  
                {/* Time Range Filter */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm">
                  {[
                    { label: '7D', value: 7 },
                    { label: '30D', value: 30 },
                    { label: '90D', value: 90 },
                  ].map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setTimeRange(range.value)}
                      className={`px-6 py-2.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
                        timeRange === range.value 
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
  
            {/* Summary Cards */}
            <div className="mb-12">
              <SummaryCards 
                totalSales={stats.totalSales} 
                totalProfit={stats.totalProfit}
                totalExpenses={stats.totalExpenses}
                totalTransactions={stats.totalTransactions} 
                totalUtang={stats.totalUtang} 
                totalCashIn={stats.totalCashIn}
                totalCashOut={stats.totalCashOut}
                totalEwalletFees={stats.totalEwalletFees}
                totalVatCollected={stats.totalVatCollected}
                totalVatableSales={stats.totalVatableSales}
                taxType={store?.taxType}
                orRange={stats.orRange}
              />
            </div>
  
            {/* Branch Performance Section (Only for All Branches) */}
            {selectedBranchId === 'all' && stats.branchStats && stats.branchStats.length > 0 && (
              <div className="mb-12">
                <BranchPerformance stats={stats.branchStats} branches={branches} />
              </div>
            )}
  
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <SalesChart 
                data={stats.salesChartData} 
                branches={selectedBranchId === 'all' ? branches : undefined} 
              />
              <CategoryChart data={stats.categoryChartData} />
            </div>
  
            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <TopProducts products={stats.topProducts} />
              </div>
              
              <div className="bg-gray-900 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600 rounded-full -mr-32 -mt-32 opacity-20 blur-3xl" />
                
                <div className="relative z-10">
                  <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                    <Download className="w-8 h-8 text-orange-500" />
                  </div>
                  <h4 className="text-3xl font-black tracking-tight mb-4 leading-tight">Export Your Data</h4>
                  <p className="text-gray-400 font-medium mb-10">Download your transaction history and inventory reports in CSV format for external accounting.</p>
                </div>
                
                <button 
                  onClick={handleExport}
                  className="w-full bg-white text-gray-900 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-95 relative z-10"
                >
                  <Download className="w-6 h-6" />
                  GENERATE CSV REPORT
                </button>
  
                <Link 
                  href="/reports/sales-journal"
                  className="w-full mt-4 bg-orange-600 text-white font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-orange-700 transition-all active:scale-95 relative z-10 shadow-lg shadow-orange-900/50"
                >
                  <FileText className="w-6 h-6" />
                  VIEW SALES JOURNAL
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
