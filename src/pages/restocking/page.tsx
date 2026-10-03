'use client';

import { useState, useEffect } from 'react';
import { useRestocking } from '@/lib/hooks/use-restocking';
import { useProducts } from '@/lib/hooks/use-products';
import { useAuth } from '@/lib/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { SupplierForm } from '@/components/restocking/supplier-form';
import { RestockForm } from '@/components/restocking/restock-form';
import { 
  Plus, Search, Truck, Package, History, ArrowLeft, 
  ShieldAlert, Loader2, Phone, Mail, MapPin, User,
  ChevronRight, Calendar, Hash, FileText
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Supplier, RestockTransaction } from '@/lib/db/idb';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useBranches } from '@/lib/hooks/use-branches';

export default function RestockingPage() {
  const { currentBranchId, loading: loadingBranches } = useBranches();
  const { 
    suppliers, restockHistory, loading, 
    addSupplier, updateSupplier, deleteSupplier, recordRestock 
  } = useRestocking();
  const { products } = useProducts(currentBranchId || undefined);
  const { isAdmin, isCashier, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'history' | 'suppliers'>('history');
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [isRestockFormOpen, setIsRestockFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
              <Truck className="w-12 h-12" />
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
          You do not have permission to access the Restocking System. Please contact your administrator.
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

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all text-gray-400 hover:text-orange-600 group"
                >
                  <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-none mb-2">Restocking</h1>
                  <p className="text-lg text-gray-500 font-medium">Manage suppliers and inventory stock-in</p>
                </div>
              </div>
  
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRestockFormOpen(true)}
                  className="bg-indigo-600 text-white font-black px-8 py-5 rounded-2xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-xs"
                >
                  <Plus className="w-5 h-5" />
                  New Restock
                </button>
              </div>
            </div>
  
            {/* Tabs */}
            <div className="flex gap-4 mb-8 bg-white p-2 rounded-[2rem] shadow-sm w-fit border border-gray-100">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 ${
                  activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <History className="w-5 h-5" />
                Purchase History
              </button>
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 ${
                  activeTab === 'suppliers' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Truck className="w-5 h-5" />
                Suppliers
              </button>
            </div>
  
            <AnimatePresence mode="wait">
              {activeTab === 'history' ? (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {restockHistory.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-xl">
                      <div className="bg-gray-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-gray-300">
                        <History className="w-12 h-12" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">No Restock History</h3>
                      <p className="text-gray-500 font-medium mb-8">Start recording your inventory purchases to see them here.</p>
                      <button
                        onClick={() => setIsRestockFormOpen(true)}
                        className="bg-gray-900 text-white font-black px-12 py-6 rounded-[2rem] shadow-2xl hover:bg-indigo-600 transition-all uppercase tracking-widest text-sm"
                      >
                        Record First Restock
                      </button>
                    </div>
                  ) : (
                    restockHistory.map((tx) => (
                      <div key={tx.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
                        <div className="flex flex-col lg:flex-row gap-8">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                                  <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Date & Time</p>
                                  <p className="font-black text-gray-900">{new Date(tx.timestamp).toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Cost</p>
                                <p className="text-2xl font-black text-indigo-600 tracking-tighter">₱{tx.totalCost.toLocaleString()}</p>
                              </div>
                            </div>
  
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-[2rem]">
                              <div className="flex items-center gap-3">
                                <Truck className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Supplier</p>
                                  <p className="font-bold text-gray-900">{suppliers.find(s => s.id === tx.supplierId)?.name || 'Unknown'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Hash className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Ref #</p>
                                  <p className="font-bold text-gray-900">{tx.referenceNumber || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Items</p>
                                  <p className="font-bold text-gray-900">{tx.items.length} Products</p>
                                </div>
                              </div>
                            </div>
                          </div>
  
                          <div className="lg:w-80 border-l border-gray-50 lg:pl-8">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Item Breakdown</p>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                              {tx.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500 font-medium">{item.name} <span className="text-gray-900 font-black">x{item.quantity}</span></span>
                                  <span className="text-gray-900 font-bold">₱{(item.quantity * item.costPrice).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            {tx.notes && (
                              <div className="mt-6 pt-6 border-t border-gray-50">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Notes</p>
                                <p className="text-sm text-gray-500 italic">&quot;{tx.notes}&quot;</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="suppliers"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search suppliers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setEditingSupplier(null);
                        setIsSupplierFormOpen(true);
                      }}
                      className="bg-gray-900 text-white font-black px-8 py-4 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3 uppercase tracking-widest text-xs"
                    >
                      <Plus className="w-5 h-5" />
                      Add Supplier
                    </button>
                  </div>
  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map((supplier) => (
                      <motion.div
                        key={supplier.id}
                        layout
                        className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform" />
                        
                        <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="bg-indigo-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                              <Truck className="w-7 h-7" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{supplier.name}</h3>
                              <div className="flex items-center gap-2 text-gray-400">
                                <User className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{supplier.contactPerson || 'No Contact Person'}</span>
                              </div>
                            </div>
                          </div>
  
                          <div className="space-y-4 mb-8">
                            {supplier.phone && (
                              <div className="flex items-center gap-3 text-gray-500">
                                <Phone className="w-4 h-4" />
                                <span className="text-sm font-bold">{supplier.phone}</span>
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center gap-3 text-gray-500">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm font-bold">{supplier.email}</span>
                              </div>
                            )}
                            {supplier.address && (
                              <div className="flex items-start gap-3 text-gray-500">
                                <MapPin className="w-4 h-4 mt-1" />
                                <span className="text-sm font-bold leading-relaxed">{supplier.address}</span>
                              </div>
                            )}
                          </div>
  
                          <button
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setIsSupplierFormOpen(true);
                            }}
                            className="w-full py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                          >
                            Edit Details <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
  
        {/* Modals */}
        <AnimatePresence>
          {isSupplierFormOpen && (
            <SupplierForm
              supplier={editingSupplier}
              onSave={(data) => {
                if (editingSupplier) {
                  updateSupplier({ ...editingSupplier, ...data });
                } else {
                  addSupplier(data);
                }
                setIsSupplierFormOpen(false);
              }}
              onDelete={editingSupplier ? (id) => {
                deleteSupplier(id);
                setIsSupplierFormOpen(false);
              } : undefined}
              onClose={() => setIsSupplierFormOpen(false)}
            />
          )}
  
          {isRestockFormOpen && (
            <RestockForm
              products={products}
              suppliers={suppliers}
              onSave={(supplierId, items, totalCost, ref, notes) => {
                recordRestock(supplierId, items, totalCost, ref, notes);
                setIsRestockFormOpen(false);
              }}
              onClose={() => setIsRestockFormOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
