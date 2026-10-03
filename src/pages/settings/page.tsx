'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/hooks/use-store';
import { useAuth } from '@/lib/contexts/auth-context';
import { motion, AnimatePresence } from 'motion/react';
import { Store, ArrowLeft, Save, Percent, X, Building2, MapPin, Hash, ClipboardList, ChevronRight, Users, Settings, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { UserManagement } from '@/components/admin/user-management';
import { AuthGuard } from '@/components/auth/auth-guard';
import { clearDatabaseAll } from '@/lib/db/sync-queue';

export default function SettingsPage() {
  const { store, updateStore, loading } = useStore();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'business' | 'users'>('business');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [tin, setTin] = useState('');
  const [taxType, setTaxType] = useState<'VAT' | 'NON-VAT'>('NON-VAT');
  const [vatRate, setVatRate] = useState(12);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await clearDatabaseAll();
      setShowClearConfirm(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to clear database:', error);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    if (store) {
      setName(store.name);
      setAddress(store.address || '');
      setTin(store.tin || '');
      setTaxType(store.taxType || 'NON-VAT');
      setVatRate(store.vatRate || 12);
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateStore(name, address, tin, taxType, vatRate);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update store:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Header />
        
        <div className="p-6 md:p-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-6">
              <Link 
                href="/"
                className="p-4 bg-white hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900 border border-gray-100 shadow-sm"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight">Settings</h1>
                <p className="text-gray-500 font-medium">Manage your business configuration.</p>
              </div>
            </div>
          </div>
  
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Basic Info Section */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Basic Information</h3>
                      </div>
  
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Store Name</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-5 font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all outline-none text-lg"
                            placeholder="Enter store name"
                          />
                        </div>
                      </div>
  
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Store Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-[2rem] pl-14 pr-8 py-5 font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all outline-none text-lg"
                            placeholder="Enter store address"
                          />
                        </div>
                      </div>
  
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">TIN (Tax Identification Number)</label>
                        <div className="relative">
                          <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                          <input
                            type="text"
                            value={tin}
                            onChange={(e) => setTin(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-[2rem] pl-14 pr-8 py-5 font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all outline-none text-lg"
                            placeholder="000-000-000-000"
                          />
                        </div>
                      </div>
                    </div>
  
                    {/* Tax Config Section */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                          <Percent className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Tax Configuration</h3>
                      </div>
  
                      <div className="grid grid-cols-1 gap-4">
                        <button
                          type="button"
                          onClick={() => setTaxType('NON-VAT')}
                          className={`p-8 rounded-[2.5rem] border-2 transition-all text-left flex items-center gap-6 ${
                            taxType === 'NON-VAT'
                              ? 'border-orange-600 bg-orange-50'
                              : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                            taxType === 'NON-VAT' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <X className="w-8 h-8" />
                          </div>
                          <div>
                            <p className={`font-black text-xl uppercase tracking-tighter ${
                              taxType === 'NON-VAT' ? 'text-orange-900' : 'text-gray-400'
                            }`}>Non-VAT</p>
                            <p className="text-sm text-gray-500 font-medium">Standard for small businesses. No tax breakdown on receipts.</p>
                          </div>
                        </button>
  
                        <button
                          type="button"
                          onClick={() => setTaxType('VAT')}
                          className={`p-8 rounded-[2.5rem] border-2 transition-all text-left flex items-center gap-6 ${
                            taxType === 'VAT'
                              ? 'border-orange-600 bg-orange-50'
                              : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                            taxType === 'VAT' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Percent className="w-8 h-8" />
                          </div>
                          <div>
                            <p className={`font-black text-xl uppercase tracking-tighter ${
                              taxType === 'VAT' ? 'text-orange-900' : 'text-gray-400'
                            }`}>VAT (12%)</p>
                            <p className="text-sm text-gray-500 font-medium">Value Added Tax. Shows detailed breakdown on all receipts.</p>
                          </div>
                        </button>
                      </div>
  
                      {taxType === 'VAT' && (
                        <div className="space-y-3 pt-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">VAT Rate (%)</label>
                          <input
                            type="number"
                            value={vatRate}
                            onChange={(e) => setVatRate(Number(e.target.value))}
                            className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-5 font-bold text-gray-900 focus:ring-4 focus:ring-orange-100 transition-all outline-none text-lg"
                            min="0"
                            max="100"
                          />
                        </div>
                      )}
                    </div>
                  </div>
  
                  <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      {showSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-green-50 text-green-600 font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full flex items-center gap-2"
                        >
                          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                          Settings Saved Successfully
                        </motion.div>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full md:w-auto bg-gray-900 text-white font-black px-12 py-6 rounded-[2rem] flex items-center justify-center gap-4 hover:bg-black transition-all active:scale-95 shadow-2xl disabled:opacity-50 disabled:scale-100 uppercase tracking-widest text-sm"
                    >
                      <Save className="w-6 h-6" />
                      {isSaving ? 'SAVING CHANGES...' : 'SAVE BUSINESS SETTINGS'}
                    </button>
                  </div>
                </form>
          </motion.div>
  
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link 
              href="/admin/users"
              className="group p-8 bg-white hover:bg-blue-50 rounded-[2.5rem] border border-gray-100 hover:border-blue-200 transition-all flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="flex items-center gap-6">
                <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">User Management</h4>
                  <p className="text-gray-500 font-medium text-sm">Manage staff accounts and permissions.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-600 transition-all" />
            </Link>

            <Link 
              href="/admin/audit-trail"
              className="group p-8 bg-white hover:bg-orange-50 rounded-[2.5rem] border border-gray-100 hover:border-orange-200 transition-all flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-orange-500/5"
            >
              <div className="flex items-center gap-6">
                <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">Audit Trail</h4>
                  <p className="text-gray-500 font-medium text-sm">View all system logs and history.</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-orange-600 transition-all" />
            </Link>
          </div>

          <div className="mt-6 p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100 flex items-start gap-6">
            <div className="bg-orange-600 p-3 rounded-xl text-white shadow-lg shadow-orange-200">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-orange-900 uppercase tracking-tight mb-2">BIR Compliance Note</h4>
              <p className="text-orange-800/70 font-medium leading-relaxed">
                Ensure your TIN and Address match your official BIR registration. These details will be printed on all Official Receipts (OR) generated by the system.
              </p>
            </div>
          </div>

          {/* Danger Zone: Clear Dummy Data */}
          <div className="mt-6 p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-6">
              <div className="bg-rose-600 p-3 rounded-xl text-white shadow-lg shadow-rose-200 flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="text-lg font-black text-rose-900 uppercase tracking-tight mb-2">Danger Zone: Remove Dummy Data</h4>
                <p className="text-rose-800/70 font-medium leading-relaxed max-w-2xl text-sm">
                  This will permanently delete all products, transactions, customers, credit logs, e-wallet items, suppliers, and restock logs from both your local browser storage (IndexedDB) and your connected Firebase Realtime Database. Your store settings and users will be preserved.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black px-8 py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-lg shadow-rose-200 shrink-0 cursor-pointer border-none"
            >
              <Trash2 className="w-4 h-4" />
              Remove Dummy Data
            </button>
          </div>

          {/* Clear Confirmation Modal */}
          <AnimatePresence>
            {showClearConfirm && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-8 md:p-10 border border-gray-100 relative text-left"
                >
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 text-rose-600">
                      <AlertTriangle className="w-8 h-8 animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Are you absolutely sure?</h3>
                    <p className="text-gray-500 font-medium mt-2 text-sm leading-relaxed">
                      This action cannot be undone. All database tables (except users and basic store settings) will be completely wiped from this device and your connected Firebase Cloud database.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      disabled={isClearing}
                      onClick={handleClearAllData}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-rose-200 cursor-pointer uppercase tracking-wider text-sm border-none"
                    >
                      {isClearing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Wiping Database...
                        </>
                      ) : (
                        'Yes, Wipe All Dummy Data'
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isClearing}
                      onClick={() => setShowClearConfirm(false)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-4 rounded-2xl transition-all cursor-pointer uppercase tracking-wider text-sm border-none"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthGuard>
  );
}
