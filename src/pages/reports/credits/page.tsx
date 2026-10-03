'use client';

import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { useBranches } from '@/lib/hooks/use-branches';
import { useAuth } from '@/lib/contexts/auth-context';
import { customerService } from '@/lib/services/customer-service';
import { Customer, CreditEntry } from '@/lib/db/idb';
import { computeCreditCrossMatch, CrossMatchResult, MatchedCredit } from '@/lib/utils/credit-matcher';
import { Header } from '@/components/layout/header';
import { AuthGuard } from '@/components/auth/auth-guard';
import { CreditHistory } from '@/components/utang/credit-history';
import { RecordTransaction } from '@/components/utang/record-transaction';
import { 
  ArrowLeft, 
  Search, 
  Download, 
  Printer, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Filter, 
  ShieldAlert, 
  Loader2,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  PieChart
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import Papa from 'papaparse';

type TimeRangeFilter = '7' | '30' | '90' | 'month' | 'all';
type BalanceFilter = 'all' | 'outstanding' | 'settled';
type ReportTab = 'customers' | 'unpaid_items' | 'payments' | 'journal';

interface CustomerSummaryWithMatch {
  customer: Customer;
  crossMatch: CrossMatchResult;
  totalCreditsTaken: number;
  totalPaymentsMade: number;
  currentBalance: number;
  unpaidCount: number;
  oldestUnpaidTimestamp: number | null;
  lastActivityTimestamp: number;
}

export default function CreditReportPage() {
  const { branches, currentBranchId, loading: loadingBranches } = useBranches();
  const { isCashier, loading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('30');
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [activeTab, setActiveTab] = useState<ReportTab>('customers');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCreditEntries, setAllCreditEntries] = useState<CreditEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modal interactions
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [recordCustomer, setRecordCustomer] = useState<Customer | null>(null);
  const [recordType, setRecordType] = useState<'credit' | 'payment' | null>(null);

  useEffect(() => {
    if (!authLoading && isCashier) {
      router.push('/');
    }
  }, [isCashier, authLoading, router]);

  // Load data
  const fetchData = async () => {
    setLoadingData(true);
    try {
      const branchIdParam = selectedBranchId === 'all' ? undefined : selectedBranchId;
      const [custList, entriesList] = await Promise.all([
        branchIdParam ? customerService.getByBranch(branchIdParam) : customerService.getAll(),
        customerService.getAllCreditEntries(branchIdParam)
      ]);
      setCustomers(custList);
      setAllCreditEntries(entriesList);
    } catch (err) {
      console.error('Failed to load credit report data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  // Date filtering cutoff
  const dateInterval = useMemo(() => {
    const now = new Date();
    if (timeRange === 'all') return null;

    let start: Date;
    if (timeRange === '7') {
      start = startOfDay(subDays(now, 7));
    } else if (timeRange === '30') {
      start = startOfDay(subDays(now, 30));
    } else if (timeRange === '90') {
      start = startOfDay(subDays(now, 90));
    } else {
      // Month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return { start, end: endOfDay(now) };
  }, [timeRange]);

  // Filter entries by time range for periodic metrics
  const periodEntries = useMemo(() => {
    if (!dateInterval) return allCreditEntries;
    return allCreditEntries.filter(e => {
      const d = new Date(e.timestamp);
      return isWithinInterval(d, dateInterval);
    });
  }, [allCreditEntries, dateInterval]);

  // Group entries by customer and compute cross-matches
  const customerSummaries: CustomerSummaryWithMatch[] = useMemo(() => {
    const customerMap = new Map<string, CreditEntry[]>();
    for (const entry of allCreditEntries) {
      const existing = customerMap.get(entry.customerId) || [];
      existing.push(entry);
      customerMap.set(entry.customerId, existing);
    }

    return customers.map(cust => {
      const entries = customerMap.get(cust.id) || [];
      const crossMatch = computeCreditCrossMatch(entries);

      const openCredits = crossMatch.credits.filter(c => c.remainingBalance > 0.0001);
      const oldestUnpaid = openCredits.length > 0 
        ? Math.min(...openCredits.map(c => c.timestamp))
        : null;

      const lastActivity = entries.length > 0 
        ? Math.max(...entries.map(e => e.timestamp))
        : cust.createdAt;

      return {
        customer: cust,
        crossMatch,
        totalCreditsTaken: crossMatch.summary.totalCredits,
        totalPaymentsMade: crossMatch.summary.totalPayments,
        currentBalance: cust.totalUtang,
        unpaidCount: openCredits.length,
        oldestUnpaidTimestamp: oldestUnpaid,
        lastActivityTimestamp: lastActivity
      };
    });
  }, [customers, allCreditEntries]);

  // Key KPI metrics
  const kpis = useMemo(() => {
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.totalUtang || 0), 0);

    // In-period credit and payments
    const periodCredits = periodEntries
      .filter(e => e.type === 'credit')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const periodPayments = periodEntries
      .filter(e => e.type === 'payment')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const debtorsCount = customers.filter(c => c.totalUtang > 0.001).length;
    const settledCount = customers.length - debtorsCount;

    const collectionRate = (periodPayments + totalOutstanding) > 0
      ? (periodPayments / (periodPayments + totalOutstanding)) * 100
      : 100;

    // Aging buckets based on active unpaid credits
    const now = Date.now();
    let currentBucket = 0; // 0-7 days
    let recentBucket = 0;  // 8-30 days
    let agingBucket = 0;   // 31-60 days
    let overdueBucket = 0; // 60+ days

    for (const item of customerSummaries) {
      for (const cred of item.crossMatch.credits) {
        if (cred.remainingBalance > 0.0001) {
          const ageInDays = (now - cred.timestamp) / (1000 * 60 * 60 * 24);
          if (ageInDays <= 7) {
            currentBucket += cred.remainingBalance;
          } else if (ageInDays <= 30) {
            recentBucket += cred.remainingBalance;
          } else if (ageInDays <= 60) {
            agingBucket += cred.remainingBalance;
          } else {
            overdueBucket += cred.remainingBalance;
          }
        }
      }
    }

    return {
      totalOutstanding,
      periodCredits,
      periodPayments,
      debtorsCount,
      settledCount,
      collectionRate,
      aging: {
        current: currentBucket,
        recent: recentBucket,
        aging: agingBucket,
        overdue: overdueBucket
      }
    };
  }, [customers, periodEntries, customerSummaries]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return customerSummaries.filter(item => {
      // Balance filter
      if (balanceFilter === 'outstanding' && item.currentBalance <= 0.001) return false;
      if (balanceFilter === 'settled' && item.currentBalance > 0.001) return false;

      // Search query
      if (q) {
        const matchesName = item.customer.name.toLowerCase().includes(q);
        const matchesContact = (item.customer.contact || '').toLowerCase().includes(q);
        if (!matchesName && !matchesContact) return false;
      }
      return true;
    }).sort((a, b) => b.currentBalance - a.currentBalance);
  }, [customerSummaries, balanceFilter, deferredSearch]);

  // All open unpaid credits list across all customers
  const allUnpaidItems = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    const list: {
      customer: Customer;
      credit: MatchedCredit;
      ageDays: number;
    }[] = [];

    const now = Date.now();

    for (const item of customerSummaries) {
      for (const cred of item.crossMatch.credits) {
        if (cred.remainingBalance > 0.0001) {
          const ageDays = Math.floor((now - cred.timestamp) / (1000 * 60 * 60 * 24));
          list.push({
            customer: item.customer,
            credit: cred,
            ageDays
          });
        }
      }
    }

    return list.filter(item => {
      if (!q) return true;
      return (
        item.customer.name.toLowerCase().includes(q) ||
        item.credit.description.toLowerCase().includes(q)
      );
    }).sort((a, b) => b.credit.remainingBalance - a.credit.remainingBalance);
  }, [customerSummaries, deferredSearch]);

  // Payments list in period
  const periodPaymentsList = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    const customerMap = new Map(customers.map(c => [c.id, c]));

    return periodEntries
      .filter(e => e.type === 'payment')
      .map(e => ({
        entry: e,
        customer: customerMap.get(e.customerId)
      }))
      .filter(item => {
        if (!q) return true;
        const custName = item.customer?.name || '';
        return (
          custName.toLowerCase().includes(q) ||
          item.entry.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.entry.timestamp - a.entry.timestamp);
  }, [periodEntries, customers, deferredSearch]);

  // Chronological journal
  const journalEntries = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    const customerMap = new Map(customers.map(c => [c.id, c]));

    return periodEntries
      .map(e => ({
        entry: e,
        customer: customerMap.get(e.customerId)
      }))
      .filter(item => {
        if (!q) return true;
        const custName = item.customer?.name || '';
        return (
          custName.toLowerCase().includes(q) ||
          item.entry.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.entry.timestamp - a.entry.timestamp);
  }, [periodEntries, customers, deferredSearch]);

  // CSV Export functions
  const handleExportSummaryCSV = () => {
    const exportData = filteredCustomers.map(item => ({
      'Customer Name': item.customer.name,
      'Contact Number': item.customer.contact || 'N/A',
      'Total Credits Issued (₱)': item.totalCreditsTaken.toFixed(2),
      'Total Payments Made (₱)': item.totalPaymentsMade.toFixed(2),
      'Current Outstanding Balance (₱)': item.currentBalance.toFixed(2),
      'Open Debts Count': item.unpaidCount,
      'Oldest Unpaid Date': item.oldestUnpaidTimestamp ? format(item.oldestUnpaidTimestamp, 'yyyy-MM-dd') : 'None',
      'Last Activity Date': format(item.lastActivityTimestamp, 'yyyy-MM-dd HH:mm')
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = format(new Date(), 'yyyy-MM-dd');
    link.setAttribute('href', url);
    link.setAttribute('download', `customer-credit-summary-${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDetailedJournalCSV = () => {
    const exportData = journalEntries.map(item => ({
      Date: format(item.entry.timestamp, 'yyyy-MM-dd HH:mm'),
      Customer: item.customer?.name || 'Unknown Customer',
      Type: item.entry.type === 'credit' ? 'CREDIT' : 'PAYMENT',
      Description: item.entry.description,
      'Amount (₱)': Math.abs(item.entry.amount).toFixed(2),
      'Target Credit ID': item.entry.targetCreditId || 'FIFO'
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const today = format(new Date(), 'yyyy-MM-dd');
    link.setAttribute('href', url);
    link.setAttribute('download', `credit-journal-detail-${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleRecordCredit = async (
    customerId: string, 
    amount: number, 
    description: string, 
    type: 'credit' | 'payment',
    targetCreditId?: string
  ) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    const now = Date.now();
    const entry: Omit<CreditEntry, 'updatedAt' | 'isDeleted'> = {
      id: crypto.randomUUID(),
      customerId,
      branchId: cust.branchId,
      amount: type === 'credit' ? amount : -amount,
      type,
      description,
      timestamp: now,
      ...(targetCreditId ? { targetCreditId } : {}),
    };

    await customerService.recordCredit(entry);
    const updatedCustomer = {
      ...cust,
      totalUtang: Math.max(0, cust.totalUtang + entry.amount),
      updatedAt: now,
    };
    await customerService.update(updatedCustomer);
    await fetchData();
  };

  const getCreditHistory = async (customerId: string) => {
    return await customerService.getCreditHistory(customerId);
  };

  if (loadingBranches || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
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
          You do not have permission to view financial credit reports.
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
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans print:bg-white">
        <div className="print:hidden">
          <Header />
        </div>

        <div className="flex-1 p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
            <div className="flex items-center gap-4">
              <Link 
                href="/reports"
                className="p-3.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all text-gray-500 hover:text-gray-900 shadow-xs"
                title="Back to Reports"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                    Credit & Receivables Report
                  </h1>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-black uppercase tracking-wider">
                    Accounts Receivable
                  </span>
                </div>
                <p className="text-gray-500 font-medium text-sm mt-1">
                  Track outstanding balances, collection rates, debt aging, and customer settlement logs.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/utang"
                className="px-5 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <Users className="w-4 h-4 text-green-600" />
                Customer Ledger
              </Link>
              <button
                onClick={handlePrintReport}
                className="px-5 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-gray-600" />
                Print Report
              </button>
              <button
                onClick={handleExportSummaryCSV}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-200 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Printable Header (Visible on print only) */}
          <div className="hidden print:block text-center border-b pb-4 mb-6">
            <h1 className="text-2xl font-black uppercase tracking-tight">Customer Credit & Receivables Report</h1>
            <p className="text-xs text-gray-500 mt-1">Store Credit Balances, Settlement Rates, and Cross-Matched Accounts</p>
            <p className="text-xs text-gray-400 mt-0.5">Date Generated: {format(new Date(), 'MMMM dd, yyyy HH:mm')}</p>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Branch Selector */}
              <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold text-gray-800 cursor-pointer"
                >
                  <option value="all">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center bg-gray-100 p-1 rounded-2xl">
                {[
                  { label: '7 Days', val: '7' },
                  { label: '30 Days', val: '30' },
                  { label: '90 Days', val: '90' },
                  { label: 'This Month', val: 'month' },
                  { label: 'All Time', val: 'all' },
                ].map(item => (
                  <button
                    key={item.val}
                    onClick={() => setTimeRange(item.val as TimeRangeFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      timeRange === item.val
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer or item..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-2xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Outstanding</span>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-red-600">
                ₱{kpis.totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 font-medium">
                <span className="font-bold text-red-700">{kpis.debtorsCount}</span> customers with balance
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Credits Issued (Period)</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900">
                ₱{kpis.periodCredits.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 font-medium">
                <span>Total new credit recorded</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payments Collected</span>
                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-green-600">
                ₱{kpis.periodPayments.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 font-medium">
                <span>Collections within selected period</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Collection Ratio</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-purple-700">
                {kpis.collectionRate.toFixed(1)}%
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 font-medium">
                <span className="font-bold text-green-600">{kpis.settledCount}</span> settled customers
              </div>
            </div>
          </div>

          {/* Credit Aging Analysis Widget */}
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Receivables Aging Analysis
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Breakdown of active unpaid balances by the length of time since credit was extended.
                </p>
              </div>
              <span className="text-xs font-bold text-gray-400">
                Aging Health
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
                  <span>0 - 7 Days (Current)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px]">Good</span>
                </div>
                <p className="text-xl font-black text-emerald-700">
                  ₱{kpis.aging.current.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">Recently taken</p>
              </div>

              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
                <div className="flex items-center justify-between text-blue-800 text-xs font-bold mb-1">
                  <span>8 - 30 Days (Recent)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 text-[10px]">Normal</span>
                </div>
                <p className="text-xl font-black text-blue-700">
                  ₱{kpis.aging.recent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-blue-600/80 mt-0.5">Within payment term</p>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl">
                <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
                  <span>31 - 60 Days (Aging)</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px]">Follow up</span>
                </div>
                <p className="text-xl font-black text-amber-700">
                  ₱{kpis.aging.aging.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-amber-600/80 mt-0.5">Needs reminder</p>
              </div>

              <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl">
                <div className="flex items-center justify-between text-rose-800 text-xs font-bold mb-1">
                  <span>60+ Days (Overdue)</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px]">Urgent</span>
                </div>
                <p className="text-xl font-black text-rose-700">
                  ₱{kpis.aging.overdue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-rose-600/80 mt-0.5">Critical collections</p>
              </div>
            </div>
          </div>

          {/* Report Tab Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-3 print:hidden">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'customers'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Customer Balances ({filteredCustomers.length})
              </button>

              <button
                onClick={() => setActiveTab('unpaid_items')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'unpaid_items'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Open Debts Detail ({allUnpaidItems.length})
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'payments'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Collections Log ({periodPaymentsList.length})
              </button>

              <button
                onClick={() => setActiveTab('journal')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'journal'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Full Audit Journal
              </button>
            </div>

            {activeTab === 'customers' && (
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl text-xs">
                <button
                  onClick={() => setBalanceFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    balanceFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setBalanceFilter('outstanding')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    balanceFilter === 'outstanding' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  With Balance ({kpis.debtorsCount})
                </button>
                <button
                  onClick={() => setBalanceFilter('settled')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    balanceFilter === 'settled' ? 'bg-white text-green-700 shadow-xs' : 'text-gray-500'
                  }`}
                >
                  Settled ({kpis.settledCount})
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: CUSTOMERS TABLE */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-4 px-6">Customer</th>
                      <th className="py-4 px-6 text-right">Total Taken</th>
                      <th className="py-4 px-6 text-right">Total Paid</th>
                      <th className="py-4 px-6 text-right">Current Balance</th>
                      <th className="py-4 px-6 text-center">Settlement Status</th>
                      <th className="py-4 px-6 text-center">Open Credits</th>
                      <th className="py-4 px-6 text-center print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingData ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-gray-400">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
                          Loading customer credit data...
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-gray-400">
                          No matching customers found.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map(item => {
                        const percentPaid = item.totalCreditsTaken > 0
                          ? Math.min(100, Math.round((item.totalPaymentsMade / item.totalCreditsTaken) * 100))
                          : 100;

                        return (
                          <tr key={item.customer.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-gray-900 text-sm">{item.customer.name}</div>
                              <div className="text-gray-400 text-[11px] font-medium">
                                {item.customer.contact || 'No Contact'}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-gray-700">
                              ₱{item.totalCreditsTaken.toFixed(2)}
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-green-700">
                              ₱{item.totalPaymentsMade.toFixed(2)}
                            </td>
                            <td className="py-4 px-6 text-right font-black text-sm">
                              <span className={item.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                                ₱{item.currentBalance.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              {item.currentBalance > 0 ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
                                  {percentPaid}% Paid
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-800 border border-green-200">
                                  ✓ Settled
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-gray-600">
                              {item.unpaidCount > 0 ? (
                                <span className="text-red-600">{item.unpaidCount} open</span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center print:hidden">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setHistoryCustomer(item.customer)}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors"
                                >
                                  View Ledger
                                </button>
                                {item.currentBalance > 0 && (
                                  <button
                                    onClick={() => {
                                      setRecordCustomer(item.customer);
                                      setRecordType('payment');
                                    }}
                                    className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-bold text-xs transition-colors"
                                  >
                                    Pay
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: UNPAID ITEMS DETAIL */}
          {activeTab === 'unpaid_items' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">All Active Outstanding Debts</h4>
                  <p className="text-xs text-gray-400">Every unsettled credit entry across all registered customers.</p>
                </div>
                <span className="text-xs font-bold text-red-600">
                  Total: ₱{kpis.totalOutstanding.toFixed(2)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Credit Date</th>
                      <th className="py-3.5 px-6">Description</th>
                      <th className="py-3.5 px-6 text-center">Age (Days)</th>
                      <th className="py-3.5 px-6 text-right">Original</th>
                      <th className="py-3.5 px-6 text-right">Paid</th>
                      <th className="py-3.5 px-6 text-right">Remaining Balance</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUnpaidItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-gray-400">
                          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                          <p className="font-bold text-gray-700">No active debts found!</p>
                          <p className="text-xs text-gray-400">All customer credits have been settled.</p>
                        </td>
                      </tr>
                    ) : (
                      allUnpaidItems.map(({ customer, credit, ageDays }) => (
                        <tr key={credit.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-gray-900">
                            {customer.name}
                          </td>
                          <td className="py-3.5 px-6 text-gray-600 font-medium">
                            {format(credit.timestamp, 'yyyy-MM-dd')}
                          </td>
                          <td className="py-3.5 px-6 text-gray-700 font-medium max-w-xs truncate">
                            {credit.description}
                          </td>
                          <td className="py-3.5 px-6 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              ageDays > 60 
                                ? 'bg-red-100 text-red-800' 
                                : ageDays > 30 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {ageDays} days
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right font-medium text-gray-600">
                            ₱{credit.originalAmount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-6 text-right font-medium text-green-700">
                            ₱{credit.amountPaid.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-6 text-right font-black text-red-600 text-sm">
                            ₱{credit.remainingBalance.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              credit.status === 'partially_paid' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {credit.status === 'partially_paid' ? 'Partial' : 'Unpaid'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COLLECTIONS LOG */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Payment Collections Log</h4>
                  <p className="text-xs text-gray-400">All customer payments collected during the selected time period.</p>
                </div>
                <span className="text-xs font-bold text-green-700">
                  Total Collected: ₱{kpis.periodPayments.toFixed(2)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Date & Time</th>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Description / Notes</th>
                      <th className="py-3.5 px-6 text-right">Payment Amount</th>
                      <th className="py-3.5 px-6 text-center">Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {periodPaymentsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-gray-400">
                          No payments recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      periodPaymentsList.map(({ entry, customer }) => (
                        <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-medium text-gray-600">
                            {format(entry.timestamp, 'yyyy-MM-dd HH:mm')}
                          </td>
                          <td className="py-3.5 px-6 font-bold text-gray-900">
                            {customer?.name || 'Customer'}
                          </td>
                          <td className="py-3.5 px-6 text-gray-700 font-medium">
                            {entry.description}
                          </td>
                          <td className="py-3.5 px-6 text-right font-black text-green-700 text-sm">
                            -₱{Math.abs(entry.amount).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-6 text-center text-gray-400 font-medium">
                            {entry.targetCreditId ? 'Specific Credit' : 'FIFO Cross-Match'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FULL AUDIT JOURNAL */}
          {activeTab === 'journal' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Credit & Collection Ledger Audit</h4>
                  <p className="text-xs text-gray-400">Complete timeline of credit issuances and customer payments.</p>
                </div>
                <button
                  onClick={handleExportDetailedJournalCSV}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Journal CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Timestamp</th>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6 text-center">Type</th>
                      <th className="py-3.5 px-6">Description</th>
                      <th className="py-3.5 px-6 text-right">Debit (+) / Credit (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {journalEntries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-gray-400">
                          No transactions found in this period.
                        </td>
                      </tr>
                    ) : (
                      journalEntries.map(({ entry, customer }) => {
                        const isCredit = entry.type === 'credit';
                        return (
                          <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-6 font-medium text-gray-600">
                              {format(entry.timestamp, 'yyyy-MM-dd HH:mm')}
                            </td>
                            <td className="py-3.5 px-6 font-bold text-gray-900">
                              {customer?.name || 'Customer'}
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                isCredit ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {isCredit ? 'CREDIT' : 'PAYMENT'}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-gray-700 font-medium">
                              {entry.description}
                            </td>
                            <td className="py-3.5 px-6 text-right font-black text-sm">
                              <span className={isCredit ? 'text-red-600' : 'text-green-600'}>
                                {isCredit ? '+' : '-'}₱{Math.abs(entry.amount).toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Customer Ledger Modal */}
        {historyCustomer && (
          <CreditHistory
            customer={historyCustomer}
            getHistory={getCreditHistory}
            onClose={() => setHistoryCustomer(null)}
          />
        )}

        {/* Record Transaction Modal */}
        {recordCustomer && recordType && (
          <RecordTransaction
            customer={recordCustomer}
            type={recordType}
            onSave={handleRecordCredit}
            onClose={() => {
              setRecordCustomer(null);
              setRecordType(null);
            }}
          />
        )}
      </div>
    </AuthGuard>
  );
}
