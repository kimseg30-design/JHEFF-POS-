'use client';

import { useStore } from '@/lib/hooks/use-store';
import { useAuth } from '@/lib/contexts/auth-context';
import { StoreSetup } from '@/components/inventory/store-setup';
import { Header } from '@/components/layout/header';
import { Loader2, Package, ShoppingCart, Users, ArrowRight, BarChart3, Truck, LayoutDashboard, Settings, CloudLightning, Copy, Check, ExternalLink, AlertTriangle, X, TrendingDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PWAInstallButton } from '@/components/pwa/pwa-install-button';

interface BaseMenuItem {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  shadow: string;
  bg: string;
  textColor: string;
  accentColor: string;
  adminOnly?: boolean;
}

interface LinkMenuItem extends BaseMenuItem {
  href: string;
  onClick?: never;
}

interface ActionMenuItem extends BaseMenuItem {
  href?: never;
  onClick: () => void;
}

type MenuItem = LinkMenuItem | ActionMenuItem;

export default function Home() {
  const { store, loading } = useStore();
  const { isCashier } = useAuth();
  const [showSyncError, setShowSyncError] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowSyncError(localStorage.getItem('firebase_sync_error') === 'Unauthorized');
    }
  }, []);

  const handleCopyRules = () => {
    navigator.clipboard.writeText(`{\n  "rules": {\n    ".read": "true",\n    ".write": "true"\n  }\n}`);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!store) {
    return <StoreSetup />;
  }

  const menuItems: MenuItem[] = [
    {
      title: 'POS Checkout',
      description: 'Start a new transaction',
      href: '/pos',
      icon: ShoppingCart,
      color: 'bg-blue-600',
      shadow: 'shadow-blue-100',
      bg: 'bg-blue-50',
      textColor: 'text-blue-900',
      accentColor: 'text-blue-600/70'
    },
    {
      title: 'Daily Summary',
      description: 'Today\'s performance',
      href: '/reports/daily',
      icon: LayoutDashboard,
      color: 'bg-rose-600',
      shadow: 'shadow-rose-100',
      bg: 'bg-rose-50',
      textColor: 'text-rose-900',
      accentColor: 'text-rose-600/70'
    },
    {
      title: 'Inventory',
      description: 'Manage products & stock',
      href: '/products',
      icon: Package,
      color: 'bg-orange-600',
      shadow: 'shadow-orange-100',
      bg: 'bg-orange-50',
      textColor: 'text-orange-900',
      accentColor: 'text-orange-600/70'
    },
    {
      title: 'Restocking',
      description: 'Suppliers & stock-in',
      href: '/restocking',
      icon: Truck,
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-100',
      bg: 'bg-indigo-50',
      textColor: 'text-indigo-900',
      accentColor: 'text-indigo-600/70',
      adminOnly: true
    },
    {
      title: 'Expenses',
      description: 'Track operational costs & bills',
      href: '/expenses',
      icon: TrendingDown,
      color: 'bg-red-600',
      shadow: 'shadow-red-100',
      bg: 'bg-red-50',
      textColor: 'text-red-900',
      accentColor: 'text-red-600/70'
    },
    {
      title: 'Credit & Receivables',
      description: 'Customer credit & payment ledger',
      href: '/utang',
      icon: Users,
      color: 'bg-green-600',
      shadow: 'shadow-green-100',
      bg: 'bg-green-50',
      textColor: 'text-green-900',
      accentColor: 'text-green-600/70',
      adminOnly: true
    },
    {
      title: 'Reports',
      description: 'Analyze sales trends',
      href: '/reports',
      icon: BarChart3,
      color: 'bg-purple-600',
      shadow: 'shadow-purple-100',
      bg: 'bg-purple-50',
      textColor: 'text-purple-900',
      accentColor: 'text-purple-600/70',
      adminOnly: true
    },
    {
      title: 'Store Settings',
      description: 'Tax & store info',
      href: '/settings',
      icon: Settings,
      color: 'bg-gray-600',
      shadow: 'shadow-gray-100',
      bg: 'bg-gray-50',
      textColor: 'text-gray-900',
      accentColor: 'text-gray-600/70',
      adminOnly: true
    }
  ];

  const filteredItems = menuItems.filter(item => !item.adminOnly || !isCashier);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-50 font-sans">
        <Header />
        
        <div className="p-6 md:p-12 max-w-7xl mx-auto">
          {/* PWA Install Banner (automatically hides if already installed) */}
          <PWAInstallButton variant="banner" className="mb-8" />

          <AnimatePresence>
            {showSyncError && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] p-6 md:p-10 shadow-xl overflow-hidden relative text-left"
              >
                <button 
                  onClick={() => setShowSyncError(false)}
                  className="absolute top-6 right-6 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 rounded-full transition-all cursor-pointer"
                  title="Dismiss alert"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex gap-5 flex-col md:flex-row items-start">
                  <div className="bg-rose-100 text-rose-600 p-4 rounded-3xl flex-shrink-0">
                    <CloudLightning className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="flex-grow text-left">
                    <h3 className="text-2xl font-black tracking-tight text-rose-950 mb-3 flex items-center gap-2">
                      Firebase Database Connection Restricted
                    </h3>
                    <p className="text-sm font-medium text-rose-800/90 leading-relaxed mb-6 max-w-3xl">
                      Your POS system successfully connected to the Firebase Realtime Database, but received an <strong className="font-bold">Unauthorized (401)</strong> response. This happens because default security rules in new Firebase projects are set to Locked Mode. Follow these simple steps to authorize access:
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-2">
                      <div className="space-y-4 text-sm text-rose-950/90 font-medium">
                        <div className="flex gap-3">
                          <span className="flex items-center justify-center bg-rose-200/60 text-rose-900 font-bold w-6 h-6 rounded-full text-xs shrink-0 mt-0.5">1</span>
                          <div>
                            Open your <a href="https://console.firebase.google.com/project/database-for-inventory-88e9f/database/realtime-database/rules" target="_blank" rel="noopener noreferrer" className="text-rose-700 underline font-black inline-flex items-center gap-1 hover:text-rose-900 transition-all cursor-pointer">
                              Firebase Rules Console <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <span className="flex items-center justify-center bg-rose-200/60 text-rose-900 font-bold w-6 h-6 rounded-full text-xs shrink-0 mt-0.5">2</span>
                          <p>Copy the database rules block on the right.</p>
                        </div>

                        <div className="flex gap-3">
                          <span className="flex items-center justify-center bg-rose-200/60 text-rose-900 font-bold w-6 h-6 rounded-full text-xs shrink-0 mt-0.5">3</span>
                          <p>Paste them inside the rules editor and click <strong className="font-bold text-rose-900">Publish</strong>.</p>
                        </div>

                        <div className="flex gap-3">
                          <span className="flex items-center justify-center bg-rose-200/60 text-rose-900 font-bold w-6 h-6 rounded-full text-xs shrink-0 mt-0.5">4</span>
                          <p>Click the <strong className="font-bold text-rose-900">Sync</strong> button in the top menu to complete data sync!</p>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={handleCopyRules}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${
                              copiedRules 
                                ? 'bg-green-600 text-white shadow-green-100' 
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                          >
                            {copiedRules ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedRules ? 'Copied!' : 'Copy Rules'}
                          </button>
                        </div>
                        <pre className="bg-gray-950 text-emerald-400 font-mono text-xs rounded-2xl p-5 border border-rose-200/30 overflow-x-auto text-left leading-normal shadow-inner max-h-[160px]">
{`{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-8 md:p-16 text-center border border-gray-100 shadow-2xl relative overflow-hidden"
          >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl" />
  
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter leading-tight">
                Mabuhay, {store.name}!
              </h2>
              <p className="text-xl text-gray-500 mb-16 font-medium max-w-2xl mx-auto">
                Your store is open and ready for business. What would you like to do today?
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {'href' in item && item.href ? (
                      <Link 
                        href={item.href}
                        className={`group block p-10 ${item.bg} rounded-[2.5rem] border border-transparent hover:border-white hover:shadow-2xl transition-all relative overflow-hidden h-full`}
                      >
                        <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-2xl ${item.shadow} group-hover:scale-110 transition-transform`}>
                          <item.icon className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                          <p className={`${item.textColor} font-black text-2xl tracking-tight mb-2`}>{item.title}</p>
                          <p className={`${item.accentColor} font-medium text-sm`}>{item.description}</p>
                        </div>
                        
                        <div className="mt-8 flex items-center gap-2 text-gray-900 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                          Open Menu <ArrowRight className="w-4 h-4" />
                        </div>
                      </Link>
                    ) : 'onClick' in item ? (
                      <button 
                        onClick={item.onClick}
                        className={`group block w-full p-10 ${item.bg} rounded-[2.5rem] border border-transparent hover:border-white hover:shadow-2xl transition-all relative overflow-hidden h-full text-left`}
                      >
                        <div className={`${item.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-2xl ${item.shadow} group-hover:scale-110 transition-transform`}>
                          <item.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <p className={`${item.textColor} font-black text-2xl tracking-tight mb-2`}>{item.title}</p>
                          <p className={`${item.accentColor} font-medium text-sm`}>{item.description}</p>
                        </div>
                        
                        <div className="mt-8 flex items-center gap-2 text-gray-900 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                          Open Settings <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
  
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-xl">
              <div>
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">Quick Tip</p>
                <h4 className="text-xl font-bold tracking-tight">Use &quot;Quick Add&quot; for items not in your inventory.</h4>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl">
                <ShoppingCart className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">Offline Ready</p>
                <h4 className="text-xl font-bold tracking-tight text-gray-900">Your data is saved locally for offline use.</h4>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl">
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
