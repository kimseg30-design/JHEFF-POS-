'use client';

import { useState, useEffect } from 'react';
import { Customer, CreditEntry } from '@/lib/db/idb';
import { customerService } from '@/lib/services/customer-service';
import { computeCreditCrossMatch, previewPaymentImpact, MatchedCredit } from '@/lib/utils/credit-matcher';
import { 
  X, 
  Save, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecordTransactionProps {
  customer: Customer;
  type: 'credit' | 'payment';
  onSave: (
    customerId: string, 
    amount: number, 
    description: string, 
    type: 'credit' | 'payment', 
    targetCreditId?: string,
    customTimestamp?: number
  ) => Promise<void>;
  onClose: () => void;
}

export function RecordTransaction({ customer, type, onSave, onClose }: RecordTransactionProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date picker for credit or payment date (defaults to current date and time)
  const [transactionDate, setTransactionDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  // Cross-matching state for payments
  const [unpaidCredits, setUnpaidCredits] = useState<MatchedCredit[]>([]);
  const [selectedTargetCreditId, setSelectedTargetCreditId] = useState<string | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(type === 'payment');

  useEffect(() => {
    if (type === 'payment' && customer.id) {
      setLoadingCredits(true);
      customerService.getCreditHistory(customer.id)
        .then(history => {
          const matchResult = computeCreditCrossMatch(history);
          const openCredits = matchResult.credits.filter(c => c.remainingBalance > 0.0001);
          setUnpaidCredits(openCredits);
        })
        .catch(err => {
          console.error('Error fetching credit history:', err);
        })
        .finally(() => {
          setLoadingCredits(false);
        });
    }
  }, [type, customer.id]);

  const numAmount = parseFloat(amount) || 0;
  const paymentPreview = type === 'payment' 
    ? previewPaymentImpact(unpaidCredits, numAmount, selectedTargetCreditId || undefined)
    : null;

  const handleSelectFullBalance = () => {
    setSelectedTargetCreditId(null);
    setAmount(customer.totalUtang.toString());
    setDescription('Full Balance Settlement');
  };

  const handleSelectCreditToPay = (credit: MatchedCredit) => {
    if (selectedTargetCreditId === credit.id) {
      // Toggle off
      setSelectedTargetCreditId(null);
      setDescription('');
    } else {
      setSelectedTargetCreditId(credit.id);
      setAmount(credit.remainingBalance.toFixed(2));
      const dateStr = new Date(credit.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
      setDescription(`Payment for credit on ${dateStr} (${credit.description})`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a transaction description.');
      return;
    }

    if (!customer.id) return;

    const customTimestamp = transactionDate ? new Date(transactionDate).getTime() : Date.now();

    setIsSaving(true);
    try {
      await onSave(
        customer.id, 
        parseFloat(amount), 
        description.trim(), 
        type, 
        selectedTargetCreditId || undefined,
        customTimestamp
      );
      onClose();
    } catch (err) {
      console.error('Record failed:', err);
      setError('Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 my-8 flex flex-col max-h-[90vh] transition-colors"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-800/60">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl text-white shadow-md ${type === 'credit' ? 'bg-red-600 shadow-red-600/20' : 'bg-green-600 shadow-green-600/20'}`}>
              {type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-950 dark:text-white uppercase tracking-tight">
                {type === 'credit' ? 'Record Customer Credit' : 'Record Payment'}
              </h3>
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                Customer: <span className="text-gray-950 dark:text-white font-black">{customer.name}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-rose-950/50 text-red-700 dark:text-rose-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-200 dark:border-rose-900/60 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current balance card */}
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">Current Outstanding Credit</p>
              <p className={`text-3xl font-black mt-0.5 ${customer.totalUtang > 0 ? 'text-red-600 dark:text-rose-400' : 'text-green-600 dark:text-emerald-400'}`}>
                ₱{customer.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {type === 'payment' && customer.totalUtang > 0 && (
              <button
                type="button"
                onClick={handleSelectFullBalance}
                className="px-4 py-2.5 bg-green-50 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-300 hover:bg-green-100 dark:hover:bg-emerald-900/60 border border-green-200 dark:border-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Settle All
              </button>
            )}
          </div>

          {/* Form */}
          <form id="record-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> 
                  {type === 'credit' ? 'Date Credit Incurred' : 'Payment Date Received'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    setTransactionDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
                  }}
                  className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
                >
                  Set to Now
                </button>
              </div>
              <input
                type="datetime-local"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-600 outline-none transition-all text-sm font-bold text-gray-950 dark:text-white bg-white dark:bg-gray-800"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
                {type === 'credit' 
                  ? 'Pick the date & time the credit was borrowed (you can backdate previous debts).'
                  : 'Pick the date & time the payment was received (you can record previous payments).'}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                <Coins className="w-3.5 h-3.5 text-emerald-600" /> Amount (₱)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-4 text-2xl font-black rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-600 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white dark:bg-gray-800 text-gray-950 dark:text-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Description (Items / Notes)
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'credit' ? 'e.g. 2kg Rice, Cooking Oil, Sugar' : 'e.g. Partial cash payment / Full settlement'}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-600 outline-none transition-all font-bold bg-white dark:bg-gray-800 text-gray-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
              />
            </div>

            {/* Cross-Matching Section for Payments */}
            {type === 'payment' && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Cross-Matching with Outstanding Credits
                    </h4>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-bold">
                    {unpaidCredits.length} active credits
                  </span>
                </div>

                {loadingCredits ? (
                  <div className="text-center py-4 text-xs text-gray-500 font-bold">
                    Calculating credits...
                  </div>
                ) : unpaidCredits.length === 0 ? (
                  <div className="p-4 bg-green-50 dark:bg-emerald-950/40 rounded-2xl text-center text-xs font-black text-green-800 dark:text-emerald-300 border border-green-200 dark:border-emerald-800">
                    No outstanding credit for this customer. Any payment recorded will be stored as an advance deposit/credit.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-bold">
                      Select a specific credit to settle, or allow automatic chronological FIFO matching:
                    </p>
                    {unpaidCredits.map(credit => {
                      const isSelected = selectedTargetCreditId === credit.id;
                      const dateStr = new Date(credit.timestamp).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });

                      return (
                        <div
                          key={credit.id}
                          onClick={() => handleSelectCreditToPay(credit)}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between text-left ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 shadow-sm' 
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs font-black text-gray-900 dark:text-white">{dateStr}</span>
                              {credit.status === 'partially_paid' && (
                                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-md font-black">
                                  Partially Paid
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate mt-0.5">{credit.description}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-bold">
                              Original Credit: ₱{credit.originalAmount.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 block uppercase">Balance</span>
                            <span className="text-sm font-black text-red-600 dark:text-rose-400">
                              ₱{credit.remainingBalance.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 block mt-0.5">
                              {isSelected ? '✓ Selected' : 'Click to settle'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Real-time Payment Allocation Preview */}
                {paymentPreview && numAmount > 0 && paymentPreview.impacts.length > 0 && (
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-black text-emerald-950 dark:text-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Cross-Match Settlement Preview:
                      </span>
                      <span>Total Covered: ₱{paymentPreview.totalCovered.toFixed(2)}</span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                      {paymentPreview.impacts.map((impact) => {
                        const dateStr = new Date(impact.timestamp).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric'
                        });
                        return (
                          <div 
                            key={impact.creditId}
                            className="flex items-center justify-between text-xs bg-white/90 dark:bg-gray-900/80 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900"
                          >
                            <div className="truncate pr-2">
                              <span className="font-black text-gray-950 dark:text-white">🗓️ {dateStr}: </span>
                              <span className="text-gray-700 dark:text-gray-300">{impact.description}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-black text-emerald-700 dark:text-emerald-300">
                                -₱{impact.amountCovered.toFixed(2)}
                              </span>
                              {impact.willBeFullySettled ? (
                                <span className="ml-2 text-[10px] bg-green-100 dark:bg-emerald-950 text-green-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-black">
                                  Paid in Full!
                                </span>
                              ) : (
                                <span className="ml-2 text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-black">
                                  Remaining: ₱{impact.remainingAfter.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {paymentPreview.unallocated > 0.001 && (
                        <div className="text-xs text-blue-800 dark:text-blue-300 font-bold pt-1">
                          ℹ️ Excess of ₱{paymentPreview.unallocated.toFixed(2)} will be recorded as advance deposit.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Footer actions */}
        <div className="p-8 bg-gray-50/80 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            form="record-form"
            type="submit"
            disabled={isSaving}
            className={`flex-[2] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all text-xs uppercase tracking-widest cursor-pointer ${
              type === 'credit' 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20 active:scale-95' 
                : 'bg-green-600 hover:bg-green-700 shadow-green-500/20 active:scale-95'
            }`}
          >
            {isSaving ? (
              <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {type === 'credit' ? 'Save Credit' : 'Save Payment'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
