'use client';

import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useCustomers } from '@/lib/hooks/use-customers';
import { useAuth } from '@/lib/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { CustomerForm } from '@/components/utang/customer-form';
import { CreditHistory } from '@/components/utang/credit-history';
import { RecordTransaction } from '@/components/utang/record-transaction';
import { Plus, Search, User, Phone, ArrowLeft, History, ArrowUpRight, ArrowDownLeft, Trash2, Edit2, UserPlus, ShieldAlert, Loader2, FileText, CheckCircle2, Wallet, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '@/lib/db/idb';
import { ConfirmModal } from '@/components/ui/modal';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useBranches } from '@/lib/hooks/use-branches';

export default function UtangPage() {
  const { currentBranchId, loading: loadingBranches } = useBranches();
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer, recordCredit, getCreditHistory } = useCustomers(currentBranchId || undefined);
  const { isCashier, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'outstanding' | 'fully_paid'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [recordType, setRecordType] = useState<'credit' | 'payment' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(searchQuery);

  const { totalReceivables, debtorsCount, fullyPaidCount } = useMemo(() => {
    let sum = 0;
    let debtors = 0;
    let paid = 0;
    for (const c of customers) {
      if (c.totalUtang > 0.001) {
        sum += c.totalUtang;
        debtors++;
      } else {
        paid++;
      }
    }
    return { totalReceivables: sum, debtorsCount: debtors, fullyPaidCount: paid };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    let result = customers;

    if (balanceFilter === 'outstanding') {
      result = result.filter(c => c.totalUtang > 0.001);
    } else if (balanceFilter === 'fully_paid') {
      result = result.filter(c => c.totalUtang <= 0.001);
    }

    if (!q) return result;
    return result.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.contact && c.contact.includes(q))
    );
  }, [customers, deferredSearch, balanceFilter]);

  useEffect(() => {
    if (!authLoading && isCashier) {
      router.push('/');
    }
  }, [isCashier, authLoading, router]);

  if (loading || authLoading || loadingBranches) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!currentBranchId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans transition-colors">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600">
              <User className="w-12 h-12" />
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
          You do not have permission to access the Utang System. Please contact your administrator.
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

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteCustomer(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <Header />
        
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Customer Credit Ledger</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Track customer credit, payments, and cross-matched ledger breakdowns.</p>
              </div>
            </div>
  
            <div className="flex items-center gap-3">
              <Link
                href="/reports/credits"
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold px-5 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Credit Report
              </Link>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setIsFormOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Add New Customer
              </button>
            </div>
          </div>
  
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div 
              onClick={() => setBalanceFilter('outstanding')}
              className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                balanceFilter === 'outstanding' 
                  ? 'bg-red-50 dark:bg-rose-950/40 border-red-200 dark:border-rose-800 ring-2 ring-red-400' 
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Receivables</span>
                <div className="p-2 bg-red-100 dark:bg-rose-900/50 text-red-600 dark:text-rose-400 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-red-600 dark:text-rose-400">
                ₱{totalReceivables.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                <strong className="text-red-700 dark:text-rose-300">{debtorsCount}</strong> customers with balances
              </p>
            </div>

            <div 
              onClick={() => setBalanceFilter('fully_paid')}
              className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                balanceFilter === 'fully_paid' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 ring-2 ring-emerald-400' 
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Fully Paid Customers</span>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {fullyPaidCount} <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">accounts</span>
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                100% Settled / Zero Balance
              </p>
            </div>

            <div 
              onClick={() => setBalanceFilter('all')}
              className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                balanceFilter === 'all' 
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 ring-2 ring-purple-400' 
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Customers</span>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-xl">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {customers.length} <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">registered</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                Active customer ledger accounts
              </p>
            </div>
          </div>

          {/* Search and Balance Filter Tabs */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers by name or contact number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm focus:ring-2 focus:ring-green-500 outline-none transition-all text-sm font-medium text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter Pills beside Search & Balances */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl shrink-0 w-full md:w-auto overflow-x-auto border border-transparent dark:border-gray-800">
              <button
                type="button"
                onClick={() => setBalanceFilter('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  balanceFilter === 'all'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All Customers ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setBalanceFilter('outstanding')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  balanceFilter === 'outstanding'
                    ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-rose-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-500 dark:text-rose-400" />
                With Balances ({debtorsCount})
              </button>
              <button
                type="button"
                onClick={() => setBalanceFilter('fully_paid')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  balanceFilter === 'fully_paid'
                    ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Fully Paid ({fullyPaidCount})
              </button>
            </div>
          </div>
  
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin border-4 border-green-200 dark:border-green-900 border-t-green-600 rounded-full w-12 h-12 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-16 text-center border border-dashed border-gray-200 dark:border-gray-800">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No customers yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Start adding customers to track their credit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl text-gray-500 dark:text-gray-400 group-hover:bg-green-50 dark:group-hover:bg-green-950/50 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-12">{customer.name}</h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{customer.contact || 'No Contact'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(customer)} className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(customer.id)} className="p-2 bg-red-50 dark:bg-rose-950/50 text-red-600 dark:text-rose-400 rounded-lg hover:bg-red-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
  
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Customer Balance</p>
                      {customer.totalUtang <= 0.001 ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Fully Paid
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-rose-950/80 text-red-700 dark:text-rose-300 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-red-500 dark:text-rose-400" />
                          Outstanding
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between">
                      <p className={`text-2xl font-black ${customer.totalUtang > 0.001 ? 'text-red-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        ₱{customer.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                        {customer.totalUtang <= 0.001 ? 'Zero Balance' : 'Unpaid Balance'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { setSelectedCustomer(customer); setRecordType('credit'); }}
                      className="flex flex-col items-center gap-1 p-3 bg-red-50 dark:bg-rose-950/50 text-red-600 dark:text-rose-400 rounded-2xl hover:bg-red-100 dark:hover:bg-rose-900/50 transition-all active:scale-95 cursor-pointer"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">Credit</span>
                    </button>
                    <button
                      onClick={() => { setSelectedCustomer(customer); setRecordType('payment'); }}
                      className="flex flex-col items-center gap-1 p-3 bg-green-50 dark:bg-emerald-950/50 text-green-600 dark:text-emerald-400 rounded-2xl hover:bg-green-100 dark:hover:bg-emerald-900/50 transition-all active:scale-95 cursor-pointer"
                    >
                      <ArrowDownLeft className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">Payment</span>
                    </button>
                    <button
                      onClick={() => setHistoryCustomer(customer)}
                      className="flex flex-col items-center gap-1 p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all active:scale-95 cursor-pointer"
                    >
                      <History className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">Ledger</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
  
        {isFormOpen && (
          <CustomerForm 
            customer={editingCustomer}
            onSave={async (c) => {
              if (editingCustomer) {
                await updateCustomer(c);
              } else {
                await addCustomer(c);
              }
            }}
            onClose={() => setIsFormOpen(false)}
          />
        )}
  
        {selectedCustomer && recordType && (
          <RecordTransaction
            customer={selectedCustomer}
            type={recordType}
            onSave={recordCredit}
            onClose={() => { setSelectedCustomer(null); setRecordType(null); }}
          />
        )}
  
        {historyCustomer && (
          <CreditHistory
            customer={historyCustomer}
            getHistory={getCreditHistory}
            onClose={() => setHistoryCustomer(null)}
          />
        )}
  
        <ConfirmModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={confirmDelete}
          title="Delete Customer"
          message="Are you sure you want to delete this customer? All credit history will be lost. This action cannot be undone."
          variant="danger"
          confirmText="Delete"
        />
      </div>
    </AuthGuard>
  );
}
