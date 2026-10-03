'use client';

import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useCustomers } from '@/lib/hooks/use-customers';
import { useAuth } from '@/lib/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { CustomerForm } from '@/components/utang/customer-form';
import { CreditHistory } from '@/components/utang/credit-history';
import { RecordTransaction } from '@/components/utang/record-transaction';
import { Plus, Search, User, Phone, ArrowLeft, History, ArrowUpRight, ArrowDownLeft, Trash2, Edit2, UserPlus, ShieldAlert, Loader2, FileText } from 'lucide-react';
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [recordType, setRecordType] = useState<'credit' | 'payment' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(searchQuery);

  const filteredCustomers = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.contact && c.contact.includes(q))
    );
  }, [customers, deferredSearch]);

  useEffect(() => {
    if (!authLoading && isCashier) {
      router.push('/');
    }
  }, [isCashier, authLoading, router]);

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
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Customer Credit Ledger</h2>
                <p className="text-gray-500 font-medium">Track customer credit, payments, and cross-matched ledger breakdowns.</p>
              </div>
            </div>
  
            <div className="flex items-center gap-3">
              <Link
                href="/reports/credits"
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold px-5 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <FileText className="w-5 h-5 text-purple-600" />
                Credit Report
              </Link>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setIsFormOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add New Customer
              </button>
            </div>
          </div>
  
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
          </div>
  
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin border-4 border-green-200 border-t-green-600 rounded-full w-12 h-12 mb-4" />
              <p className="text-gray-500 font-medium">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No customers yet</h3>
              <p className="text-gray-500 mt-1">Start adding customers to track their credit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-3 rounded-2xl text-gray-500 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 truncate pr-12">{customer.name}</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{customer.contact || 'No Contact'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(customer)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(customer.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
  
                  <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
                    <div className="flex items-baseline justify-between">
                      <p className={`text-2xl font-black ${customer.totalUtang > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₱{customer.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        customer.totalUtang > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {customer.totalUtang > 0 ? 'Outstanding' : 'Settled'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { setSelectedCustomer(customer); setRecordType('credit'); }}
                      className="flex flex-col items-center gap-1 p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all active:scale-95"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">Credit</span>
                    </button>
                    <button
                      onClick={() => { setSelectedCustomer(customer); setRecordType('payment'); }}
                      className="flex flex-col items-center gap-1 p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-all active:scale-95"
                    >
                      <ArrowDownLeft className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">Payment</span>
                    </button>
                    <button
                      onClick={() => setHistoryCustomer(customer)}
                      className="flex flex-col items-center gap-1 p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all active:scale-95"
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
            onSave={editingCustomer ? updateCustomer : addCustomer}
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
