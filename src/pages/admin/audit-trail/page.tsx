'use client';

import { useState } from 'react';
import { useAuditLogs } from '@/lib/hooks/use-audit-logs';
import { motion } from 'motion/react';
import { 
  ClipboardList, 
  ArrowLeft, 
  Search, 
  Calendar, 
  User, 
  Activity,
  ChevronRight,
  Filter,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { format } from 'date-fns';

export default function AuditTrailPage() {
  const { logs, loading, refresh } = useAuditLogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user && log.user.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesAction;
  });

  const actionTypes = Array.from(new Set(logs.map(l => l.action))) as string[];

  const getActionColor = (action: string) => {
    if (action.includes('TRANSACTION')) return 'bg-green-100 text-green-700';
    if (action.includes('PRODUCT')) return 'bg-blue-100 text-blue-700';
    if (action.includes('STORE')) return 'bg-purple-100 text-purple-700';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors">
      <Header />
      
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-6">
            <Link 
              href="/settings"
              className="p-4 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-4xl font-black text-gray-950 dark:text-white tracking-tighter leading-tight uppercase">Audit Trail</h1>
              <p className="text-gray-600 dark:text-gray-300 font-bold mt-1 text-sm">Monitor all significant actions and changes within the system.</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={refresh}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all text-gray-950 dark:text-white border border-gray-100 dark:border-gray-800 shadow-sm font-black text-xs uppercase tracking-widest cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 transition-colors">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 ml-2">Search Logs</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-950 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm font-bold placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 ml-2">Action Type</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterAction('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                      filterAction === 'all' 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'
                    }`}
                  >
                    All
                  </button>
                  {actionTypes.map(type => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setFilterAction(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                        filterAction === type 
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'
                      }`}
                    >
                      {type.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-orange-600 p-8 rounded-[2rem] text-white shadow-xl shadow-orange-500/20">
              <Activity className="w-8 h-8 mb-4 opacity-80" />
              <h3 className="text-2xl font-black tracking-tight mb-2">System Integrity</h3>
              <p className="text-orange-100 text-sm font-bold leading-relaxed">
                Audit logs are stored locally and synced to the cloud to ensure a permanent record of all business operations.
              </p>
            </div>
          </div>

          {/* Logs List */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest">Loading Audit Logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 text-center px-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-full mb-6">
                  <ClipboardList className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-black text-gray-950 dark:text-white uppercase tracking-tight mb-2">No logs found</h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-xs mx-auto font-bold text-sm">Try adjusting your search or filters to find what you&apos;re looking for.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-lg ${getActionColor(log.action)}`}>
                        {log.action.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {format(log.timestamp, 'MMM dd, yyyy • hh:mm a')}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-950 dark:text-white font-black text-lg leading-tight">
                          {log.details.startsWith('{') ? (
                            (() => {
                              try {
                                const details = JSON.parse(log.details);
                                if (log.action === 'TRANSACTION_COMPLETE') {
                                  return `Transaction ${details.orNumber || details.ticketNumber} completed for ₱${details.total.toLocaleString()}`;
                                }
                                if (log.action.startsWith('PRODUCT_')) {
                                  return `${log.action.replace('PRODUCT_', '').toLowerCase()} product: ${details.name || details.id}`;
                                }
                                return log.details;
                              } catch (e) {
                                return log.details;
                              }
                            })()
                          ) : log.details}
                        </p>
                        {log.user && (
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <User className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{log.user}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="hidden md:block h-10 w-px bg-gray-100" />
                      <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-orange-50 hover:text-orange-600 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
