'use client';

import { useState } from 'react';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useBranches } from '@/lib/hooks/use-branches';
import { useReceipt } from '@/lib/context/receipt-context';
import { Header } from '@/components/layout/header';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Receipt as ReceiptIcon, 
  ChevronRight,
  Clock,
  CreditCard,
  Banknote,
  X,
  Printer,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '@/lib/db/idb';
import { useEffect } from 'react';
import Papa from 'papaparse';

export default function TicketHistoryPage() {
  const { currentBranchId, currentBranch } = useBranches();
  const { transactions, loading } = useTransactions(currentBranchId || undefined);
  const { showReceipt } = useReceipt();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(t => 
    t.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.orNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExport = () => {
    const exportData = filteredTransactions.flatMap(t => 
      t.items.map(item => ({
        ticketNumber: t.ticketNumber,
        orNumber: t.orNumber,
        name: item.name,
        price: item.price,
        qty: item.quantity,
        total: item.price * item.quantity,
        date: new Date(t.timestamp).toLocaleDateString()
      }))
    );

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/pos"
                className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-gray-900 border border-gray-100 shadow-sm"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Ticket History</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">View and manage past transactions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="bg-white hover:bg-gray-50 text-gray-900 font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 border border-gray-200 shadow-sm transition-all active:scale-95"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search ticket # or items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest">Loading history...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                <ReceiptIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest">No tickets found</p>
              </div>
            ) : (
              filteredTransactions.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-orange-50 p-4 rounded-2xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <ReceiptIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex flex-col">
                          <h4 className="font-black text-lg text-gray-900 tracking-tight">{ticket.ticketNumber || 'N/A'}</h4>
                          {ticket.orNumber && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ticket.orNumber}</span>}
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                          ticket.paymentMethod === 'cash' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {ticket.paymentMethod}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ticket.timestamp).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-xl font-black text-gray-900">₱{ticket.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-gray-900 transition-colors" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedTicket(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 bg-gray-900 text-white relative">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-orange-600 p-4 rounded-2xl shadow-lg shadow-orange-900/50">
                    <ReceiptIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase">Ticket Details</h3>
                    <div className="flex flex-col">
                      <p className="text-orange-400 font-black text-xs uppercase tracking-widest">{selectedTicket.ticketNumber}</p>
                      {selectedTicket.orNumber && <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">{selectedTicket.orNumber}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Date & Time</p>
                    <p className="font-bold">{new Date(selectedTicket.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Payment Method</p>
                    <div className="flex items-center gap-2">
                      {selectedTicket.paymentMethod === 'cash' ? <Banknote className="w-4 h-4 text-green-400" /> : <CreditCard className="w-4 h-4 text-blue-400" />}
                      <p className="font-bold uppercase">{selectedTicket.paymentMethod}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 max-h-[400px] overflow-y-auto">
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4">Items Summary</p>
                <div className="space-y-4">
                  {selectedTicket.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 w-10 h-10 rounded-xl flex items-center justify-center font-black text-gray-900 text-xs">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-400">₱{item.price.toLocaleString()} each</p>
                        </div>
                      </div>
                      <p className="font-black text-gray-900">₱{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">₱{selectedTicket.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                </div>
                <button 
                  onClick={() => showReceipt({
                    ticketNumber: selectedTicket.ticketNumber || 'N/A',
                    orNumber: selectedTicket.orNumber,
                    timestamp: selectedTicket.timestamp,
                    items: selectedTicket.items,
                    total: selectedTicket.total,
                    paymentMethod: selectedTicket.paymentMethod,
                    type: 'sales'
                  })}
                  className="flex items-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  Reprint Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
