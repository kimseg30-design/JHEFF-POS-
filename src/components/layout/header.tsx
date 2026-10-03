'use client';

import { useStore } from '@/lib/hooks/use-store';
import { useAuth } from '@/lib/contexts/auth-context';
import { Store, Clock, UserCircle, ChevronDown, LogOut, RefreshCw, CloudLightning } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BranchSelector } from './branch-selector';
import { BranchManagement } from '../branches/branch-management';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pullSync, processQueue } from '@/lib/db/sync-queue';
import { PWAInstallButton } from '@/components/pwa/pwa-install-button';

export function Header({ ticketNumber }: { ticketNumber?: string }) {
  const { store } = useStore();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isManagingBranches, setIsManagingBranches] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [hasSyncError, setHasSyncError] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasSyncError(localStorage.getItem('firebase_sync_error') === 'Unauthorized');
    }
  }, [isSyncing]);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      await pullSync();
      await processQueue();
      setSyncSuccess(true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('firebase_sync_error');
        setHasSyncError(false);
      }
      setTimeout(() => setSyncSuccess(false), 3000);
      window.location.reload();
    } catch (error) {
      console.error('Manual sync failed:', error);
      if (typeof window !== 'undefined') {
        setHasSyncError(localStorage.getItem('firebase_sync_error') === 'Unauthorized');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <div className="bg-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-200">
          <Store className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-black text-xl md:text-2xl tracking-tight text-gray-900 leading-tight">
            {store?.name || 'Sari-Sari POS'}
          </h1>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {ticketNumber && (
              <div className="flex items-center gap-1 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                <span className="w-1 h-1 bg-orange-600 rounded-full" />
                Ticket: {ticketNumber}
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      <div className="flex items-center gap-3">
        {/* PWA Install Button */}
        <PWAInstallButton variant="header" />

        {/* Firebase Sync Button */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
            isSyncing 
              ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse'
              : syncSuccess
              ? 'bg-green-50 border-green-200 text-green-600'
              : hasSyncError
              ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
              : 'bg-white hover:bg-gray-50 border-gray-100 text-gray-700 shadow-sm'
          }`}
          title={hasSyncError ? "Firebase rules are blocking sync. Click to retry." : "Synchronize data with Firebase Realtime Database"}
        >
          {hasSyncError && !isSyncing && !syncSuccess ? (
            <CloudLightning className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          )}
          <span className="hidden md:inline">
            {isSyncing ? 'Syncing...' : syncSuccess ? 'Synced' : hasSyncError ? 'Auth Error' : 'Sync'}
          </span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 transition-all group"
          >
            <div className={`p-1.5 rounded-lg ${user?.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
              <UserCircle className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">{user?.role}</p>
              <p className="text-xs font-bold text-gray-900 uppercase tracking-tight truncate max-w-[100px]">{user?.email}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-gray-50 mb-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Logged in as</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.email}</p>
                  </div>
                  {isAdmin && (
                    <Link
                      href="/admin/users"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-blue-50 text-blue-600"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-100">
                        <UserCircle className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">Manage Users</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-red-50 text-red-600"
                  >
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">Logout</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <BranchSelector onManageBranches={() => setIsManagingBranches(true)} />
        
        <div className="hidden lg:flex flex-col text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
            Current Date
          </p>
          <p className="text-sm font-bold text-gray-900">
            {new Date().toLocaleDateString('en-PH', { dateStyle: 'medium' })}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isManagingBranches && (
          <BranchManagement onClose={() => setIsManagingBranches(false)} />
        )}
      </AnimatePresence>
    </header>
  );
}
