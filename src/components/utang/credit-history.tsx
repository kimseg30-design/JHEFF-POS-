'use client';

import { useState, useEffect, useMemo } from 'react';
import { Customer, CreditEntry } from '@/lib/db/idb';
import { 
  computeCreditCrossMatch, 
  CrossMatchResult, 
  MatchedCredit, 
  MatchedPayment 
} from '@/lib/utils/credit-matcher';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Printer, 
  Layers, 
  Coins, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Tag,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreditHistoryProps {
  customer: Customer;
  getHistory: (id: string) => Promise<CreditEntry[]>;
  onClose: () => void;
}

type TabType = 'cross_match' | 'payments' | 'unpaid' | 'all';

export function CreditHistory({ customer, getHistory, onClose }: CreditHistoryProps) {
  const [history, setHistory] = useState<CreditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('cross_match');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCreditIds, setExpandedCreditIds] = useState<Record<string, boolean>>({});
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (customer.id) {
        const data = await getHistory(customer.id);
        setHistory(data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [customer.id, getHistory]);

  const crossMatchResult: CrossMatchResult = useMemo(() => {
    return computeCreditCrossMatch(history);
  }, [history]);

  const toggleExpand = (id: string) => {
    setExpandedCreditIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered lists based on search
  const filteredCredits = useMemo(() => {
    return crossMatchResult.credits.filter(c => 
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      new Date(c.timestamp).toLocaleDateString('en-PH').includes(searchQuery)
    );
  }, [crossMatchResult.credits, searchQuery]);

  const filteredPayments = useMemo(() => {
    return crossMatchResult.payments.filter(p => 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      new Date(p.timestamp).toLocaleDateString('en-PH').includes(searchQuery)
    );
  }, [crossMatchResult.payments, searchQuery]);

  const unpaidCredits = useMemo(() => {
    return filteredCredits.filter(c => c.status !== 'fully_paid');
  }, [filteredCredits]);

  // Combined chronological list
  const chronologicalEntries = useMemo(() => {
    return [...history].sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] my-auto"
      >
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-md shadow-blue-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{customer.name}</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Cross-Matched Customer Ledger & Payment History
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors shadow-sm"
              title="Statement of Account"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>Statement / SOA</span>
            </button>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-200/80 rounded-full transition-colors text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KPI Metrics Summary Bar */}
        <div className="p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Current Balance</p>
              <p className={`text-2xl font-black ${customer.totalUtang > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₱{customer.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                {customer.totalUtang > 0 ? 'Outstanding Receivable' : 'Zero Balance / Fully Settled'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Credits Taken</p>
              <p className="text-2xl font-black text-gray-800">
                ₱{crossMatchResult.summary.totalCredits.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                {crossMatchResult.credits.length} total credit records
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Payments Made</p>
              <p className="text-2xl font-black text-green-600">
                ₱{crossMatchResult.summary.totalPayments.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                {crossMatchResult.payments.length} payment records
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Credit Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">
                  {crossMatchResult.summary.totalSettledCredits} Settled
                </span>
                <span className="text-xs font-black text-red-700 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                  {crossMatchResult.summary.totalUnpaidCredits + crossMatchResult.summary.totalPartialCredits} Open
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                Cross-Match Verification
              </p>
            </div>
          </div>
        </div>

        {/* Tabs & Search Navigation */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('cross_match')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'cross_match'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Cross-Match Ledger
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-blue-100 text-blue-700">
                {crossMatchResult.credits.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('unpaid')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'unpaid'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              Outstanding Balances
              {unpaidCredits.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-red-100 text-red-700">
                  {unpaidCredits.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-green-600" />
              Payments & Breakdown
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-green-100 text-green-700">
                {crossMatchResult.payments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-gray-600" />
              Timeline
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search by date or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin border-4 border-blue-200 border-t-blue-600 rounded-full w-10 h-10 mb-3" />
              <p className="text-gray-500 text-xs font-medium">Calculating cross-matched ledger...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-bold text-sm">No transactions found for this customer.</p>
              <p className="text-gray-400 text-xs mt-1">Recorded credits and payments will appear here with automatic settlement matching.</p>
            </div>
          ) : (
            <>
              {/* TAB 1: CROSS-MATCH LEDGER (DEBTS WITH APPLIED PAYMENTS) */}
              {activeTab === 'cross_match' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                    <span>Showing each credit and the payment amounts applied to it:</span>
                    <button 
                      onClick={() => {
                        const allExpanded = filteredCredits.every(c => expandedCreditIds[c.id]);
                        const next: Record<string, boolean> = {};
                        filteredCredits.forEach(c => { next[c.id] = !allExpanded; });
                        setExpandedCreditIds(next);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      {filteredCredits.every(c => expandedCreditIds[c.id]) ? 'Collapse All' : 'Expand All'}
                    </button>
                  </div>

                  {filteredCredits.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl text-xs text-gray-400">
                      No matching credits found.
                    </div>
                  ) : (
                    filteredCredits.map((credit, index) => {
                      const isExpanded = !!expandedCreditIds[credit.id];
                      const percentPaid = Math.min(100, Math.round((credit.amountPaid / credit.originalAmount) * 100));

                      return (
                        <motion.div
                          key={credit.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            credit.status === 'fully_paid'
                              ? 'bg-white border-green-200/80 shadow-sm hover:border-green-300'
                              : credit.status === 'partially_paid'
                              ? 'bg-white border-amber-200 shadow-sm hover:border-amber-300'
                              : 'bg-white border-red-200 shadow-sm hover:border-red-300'
                          }`}
                        >
                          {/* Credit Item Summary Row */}
                          <div 
                            onClick={() => toggleExpand(credit.id)}
                            className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="flex items-start gap-3.5">
                              <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                                credit.status === 'fully_paid' 
                                   ? 'bg-green-100 text-green-700' 
                                   : credit.status === 'partially_paid'
                                   ? 'bg-amber-100 text-amber-700'
                                   : 'bg-red-100 text-red-600'
                              }`}>
                                {credit.status === 'fully_paid' ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : credit.status === 'partially_paid' ? (
                                  <Clock className="w-5 h-5" />
                                ) : (
                                  <AlertCircle className="w-5 h-5" />
                                )}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-black text-gray-900">
                                    🗓️ Credit Date: {formatShortDate(credit.timestamp)}
                                  </span>

                                  {credit.status === 'fully_paid' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-800 border border-green-200">
                                      ✓ Paid in Full
                                    </span>
                                  )}
                                  {credit.status === 'partially_paid' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                      Partially Paid ({percentPaid}%)
                                    </span>
                                  )}
                                  {credit.status === 'unpaid' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                                      Unpaid
                                    </span>
                                  )}
                                </div>

                                <p className="text-sm font-bold text-gray-800 mt-1">
                                  {credit.description}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                  <span>{formatDate(credit.timestamp)}</span>
                                  {credit.settledAt && credit.status === 'fully_paid' && (
                                    <span className="text-green-600 font-semibold">
                                      • Fully settled on: {formatShortDate(credit.settledAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Original Credit</span>
                                <span className="text-lg font-black text-gray-900">
                                  ₱{credit.originalAmount.toFixed(2)}
                                </span>
                              </div>

                              <div className="text-right sm:mt-1">
                                {credit.status === 'fully_paid' ? (
                                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">
                                    ₱0.00 Balance
                                  </span>
                                ) : (
                                  <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                                    Balance: ₱{credit.remainingBalance.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-100 h-1.5">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                credit.status === 'fully_paid' 
                                  ? 'bg-green-500' 
                                  : credit.status === 'partially_paid'
                                  ? 'bg-amber-500'
                                  : 'bg-red-300'
                              }`}
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>

                          {/* Expanded Breakdown of Applied Payments */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 bg-gray-50/80 border-t border-gray-100 space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                                <span className="flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                                  Breakdown of Payments Applied to this Credit:
                                </span>
                                <span className="text-gray-500">
                                  Total Applied: ₱{credit.amountPaid.toFixed(2)} / ₱{credit.originalAmount.toFixed(2)}
                                </span>
                              </div>

                              {credit.appliedPayments.length === 0 ? (
                                <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-500 font-medium text-center">
                                  No payments applied to this credit yet. Full ₱{credit.originalAmount.toFixed(2)} is outstanding balance.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {credit.appliedPayments.map((pmt, pIdx) => (
                                    <div 
                                      key={`${credit.id}-${pmt.paymentId}-${pIdx}`}
                                      className="p-3 bg-white rounded-xl border border-gray-200/90 shadow-2xs flex items-center justify-between text-xs"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className="bg-green-100 text-green-700 p-1.5 rounded-lg">
                                          <ArrowDownLeft className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                          <p className="font-bold text-gray-900">
                                            Payment Date: {formatDate(pmt.paymentTimestamp)}
                                          </p>
                                          <p className="text-gray-500 text-[11px]">
                                            From record: &ldquo;{pmt.paymentDescription}&rdquo;
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[10px] text-gray-400 font-bold block uppercase">Applied</span>
                                        <span className="font-black text-green-700 text-sm">
                                          -₱{pmt.amountApplied.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {credit.remainingBalance > 0.001 && (
                                <div className="flex items-center justify-between text-xs pt-1 px-1 font-bold text-red-600">
                                  <span>Remaining Balance for this credit:</span>
                                  <span>₱{credit.remainingBalance.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: PAYMENTS WITH BREAKDOWN OF COVERED DEBTS */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 px-1">
                    Customer payments and the list of credits covered or reduced:
                  </p>

                  {filteredPayments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl text-xs text-gray-400">
                      No payments recorded for this customer.
                    </div>
                  ) : (
                    filteredPayments.map((pmt, index) => (
                      <motion.div
                        key={pmt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 text-green-700 p-2.5 rounded-2xl">
                              <ArrowDownLeft className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-900">
                                  🗓️ Payment Date: {formatDate(pmt.timestamp)}
                                </span>
                                <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                  Payment
                                </span>
                              </div>
                              <p className="text-sm font-bold text-gray-800 mt-0.5">{pmt.description}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Payment Amount</span>
                            <span className="text-xl font-black text-green-600">
                              -₱{pmt.paymentAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Covered Debts Breakdown */}
                        <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 border border-gray-100">
                          <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                            Credits Covered / Reduced by this Payment:
                          </p>

                          {pmt.coveredCredits.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">
                              No open credits covered (advance deposit / excess payment).
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {pmt.coveredCredits.map((cov, cIdx) => (
                                <div 
                                  key={`${pmt.id}-${cov.creditId}-${cIdx}`}
                                  className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-gray-200"
                                >
                                  <div>
                                    <span className="font-bold text-gray-900">
                                      🗓️ Credit on {formatShortDate(cov.creditTimestamp)}:
                                    </span>
                                    <span className="text-gray-600 ml-1">
                                      {cov.creditDescription}
                                    </span>
                                    <span className="text-gray-400 text-[10px] ml-1.5">
                                      (Total credit: ₱{cov.originalCreditAmount.toFixed(2)})
                                    </span>
                                  </div>

                                  <div className="text-right flex items-center gap-2">
                                    <span className="font-black text-green-700">
                                      Covered: ₱{cov.amountCovered.toFixed(2)}
                                    </span>
                                    {cov.isFullySettledByThis ? (
                                      <span className="text-[10px] font-bold bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                        ✓ Paid in Full
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                        Remaining: ₱{cov.creditRemainingAfter.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {pmt.unallocatedAmount > 0.001 && (
                            <div className="text-xs text-blue-700 font-bold bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center justify-between">
                              <span>ℹ️ Excess Payment / Advance Deposit:</span>
                              <span>₱{pmt.unallocatedAmount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: UNPAID / OPEN BALANCES ONLY */}
              {activeTab === 'unpaid' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-red-900 uppercase tracking-wider">
                        Outstanding Credit Balances
                      </h4>
                      <p className="text-xs text-red-700 mt-0.5">
                        Shows specific dates and items with remaining unpaid balances.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-red-600">
                        ₱{customer.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {unpaidCredits.length === 0 ? (
                    <div className="text-center py-16 bg-green-50 rounded-2xl border border-green-200">
                      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <h4 className="text-base font-bold text-green-900">No Active Credits!</h4>
                      <p className="text-xs text-green-700 mt-1">All previous credits have been fully paid.</p>
                    </div>
                  ) : (
                    unpaidCredits.map((credit, index) => (
                      <div 
                        key={credit.id}
                        className="p-4 bg-white rounded-2xl border border-red-200 shadow-xs flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-100 text-red-600 rounded-xl mt-0.5">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gray-900">
                                🗓️ Date: {formatDate(credit.timestamp)}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                {credit.status === 'partially_paid' ? 'Partially Paid' : 'Unpaid'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-800 mt-1">{credit.description}</p>
                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-3">
                              <span>Original Credit: ₱{credit.originalAmount.toFixed(2)}</span>
                              <span>• Paid: ₱{credit.amountPaid.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Remaining Balance</span>
                          <span className="text-lg font-black text-red-600">
                            ₱{credit.remainingBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: CHRONOLOGICAL TIMELINE */}
              {activeTab === 'all' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 px-1">
                    Complete chronological timeline of all transactions (credits and payments):
                  </p>

                  {chronologicalEntries.map((entry, index) => {
                    const isCredit = entry.type === 'credit';
                    const matchedCredit = isCredit ? crossMatchResult.credits.find(c => c.id === entry.id) : null;
                    const matchedPayment = !isCredit ? crossMatchResult.payments.find(p => p.id === entry.id) : null;

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl ${isCredit ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {isCredit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{entry.description}</span>
                              {matchedCredit && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  matchedCredit.status === 'fully_paid' 
                                    ? 'bg-green-100 text-green-700' 
                                    : matchedCredit.status === 'partially_paid'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {matchedCredit.status === 'fully_paid' 
                                    ? '✓ Paid in Full' 
                                    : matchedCredit.status === 'partially_paid'
                                    ? `Balance: ₱${matchedCredit.remainingBalance.toFixed(2)}`
                                    : 'Unpaid'}
                                </span>
                              )}
                              {matchedPayment && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  Applied to {matchedPayment.coveredCredits.length} credit(s)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(entry.timestamp)}
                            </div>
                          </div>
                        </div>

                        <div className={`text-base font-black ${isCredit ? 'text-red-600' : 'text-green-600'}`}>
                          {isCredit ? '+' : '-'} ₱{Math.abs(entry.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="font-bold text-gray-800">{crossMatchResult.credits.length}</span> Credits •{' '}
            <span className="font-bold text-gray-800">{crossMatchResult.payments.length}</span> Payments
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px] block">Current Balance</span>
              <span className={`text-2xl font-black ${customer.totalUtang > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₱{customer.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>

      {/* PRINTABLE STATEMENT OF ACCOUNT / RESIBO MODAL */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto print:p-0 print:m-0 print:max-h-none print:shadow-none"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-6 print:hidden">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-bold text-gray-900">Statement of Account (Credit & Payment History)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="space-y-6 text-gray-900 font-sans">
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-black uppercase tracking-tight">Statement of Account</h2>
                  <p className="text-xs text-gray-500 mt-1">Cross-Matched Customer Credit Ledger & Payment Breakdown</p>
                  <p className="text-xs text-gray-400 mt-0.5">Date: {new Date().toLocaleDateString('en-PH', { dateStyle: 'full' })}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl">
                  <div>
                    <span className="text-gray-400 font-bold uppercase block text-[10px]">Customer Name</span>
                    <span className="text-sm font-black">{customer.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase block text-[10px]">Contact Info</span>
                    <span className="text-sm font-bold">{customer.contact || 'No Contact Provided'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase block text-[10px]">Total Credits Issued</span>
                    <span className="font-bold text-gray-800">₱{crossMatchResult.summary.totalCredits.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase block text-[10px]">Total Payments Received</span>
                    <span className="font-bold text-green-700">₱{crossMatchResult.summary.totalPayments.toFixed(2)}</span>
                  </div>
                </div>

                {/* Table of Debts & Settlements */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-600 mb-2">
                    Detailed Credit Records & Settlement Status:
                  </h4>
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-900 bg-gray-100">
                        <th className="py-2 px-2 font-black">Credit Date</th>
                        <th className="py-2 px-2 font-black">Items / Description</th>
                        <th className="py-2 px-2 font-black text-right">Credit Amount</th>
                        <th className="py-2 px-2 font-black text-right">Amount Paid</th>
                        <th className="py-2 px-2 font-black text-right">Remaining Balance</th>
                        <th className="py-2 px-2 font-black text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {crossMatchResult.credits.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2.5 px-2 font-medium">{formatShortDate(c.timestamp)}</td>
                          <td className="py-2.5 px-2">
                            <span className="font-bold block">{c.description}</span>
                            {c.appliedPayments.length > 0 && (
                              <span className="text-[10px] text-gray-500 block">
                                Applied: {c.appliedPayments.map(p => `₱${p.amountApplied.toFixed(2)} on ${formatShortDate(p.paymentTimestamp)}`).join(', ')}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold">₱{c.originalAmount.toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-green-700">₱{c.amountPaid.toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-right font-black text-red-600">₱{c.remainingBalance.toFixed(2)}</td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'fully_paid' 
                                ? 'bg-green-100 text-green-800' 
                                : c.status === 'partially_paid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {c.status === 'fully_paid' ? 'PAID IN FULL' : c.status === 'partially_paid' ? 'PARTIAL' : 'UNPAID'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Final Total Box */}
                <div className="border-t-2 border-gray-900 pt-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">This statement is an official certified record from the store credit ledger.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold uppercase text-gray-500 block">Current Total Balance:</span>
                    <span className="text-2xl font-black text-red-600">
                      ₱{customer.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                  <div className="border-t border-gray-400 pt-2">
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-gray-400 text-[10px]">Customer Signature</p>
                  </div>
                  <div className="border-t border-gray-400 pt-2">
                    <p className="font-bold">Store Cashier / Manager</p>
                    <p className="text-gray-400 text-[10px]">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
