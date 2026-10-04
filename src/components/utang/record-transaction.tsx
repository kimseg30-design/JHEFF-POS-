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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 my-8 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl text-white shadow-sm ${type === 'credit' ? 'bg-red-500' : 'bg-green-600'}`}>
              {type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {type === 'credit' ? 'Record Customer Credit' : 'Record Payment'}
              </h3>
              <p className="text-xs font-semibold text-gray-400">
                Customer: <span className="text-gray-700 font-bold">{customer.name}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current balance card */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Outstanding Credit</p>
              <p className={`text-2xl font-black ${customer.totalUtang > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₱{customer.totalUtang.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {type === 'payment' && customer.totalUtang > 0 && (
              <button
                type="button"
                onClick={handleSelectFullBalance}
                className="px-3.5 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Settle All
              </button>
            )}
          </div>

          {/* Form */}
          <form id="record-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
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
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Set to Now
                </button>
              </div>
              <input
                type="datetime-local"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-xs font-semibold text-gray-800 bg-gray-50/50"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {type === 'credit' 
                  ? 'Pick the date & time the credit was borrowed (you can backdate previous debts).'
                  : 'Pick the date & time the payment was received (you can record previous payments).'}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Coins className="w-3.5 h-3.5 text-gray-400" /> Amount (₱)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3.5 text-lg font-bold rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-gray-400" /> Description (Items / Notes)
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'credit' ? 'e.g. 2kg Rice, Cooking Oil, Sugar' : 'e.g. Partial cash payment / Full settlement'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Cross-Matching Section for Payments */}
            {type === 'payment' && (
              <div className="pt-2 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Cross-Matching with Outstanding Credits
                    </h4>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {unpaidCredits.length} active credits
                  </span>
                </div>

                {loadingCredits ? (
                  <div className="text-center py-4 text-xs text-gray-400 font-medium">
                    Calculating credits...
                  </div>
                ) : unpaidCredits.length === 0 ? (
                  <div className="p-4 bg-green-50 rounded-xl text-center text-xs font-bold text-green-700">
                    No outstanding credit for this customer. Any payment recorded will be stored as an advance deposit/credit.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <p className="text-[11px] text-gray-500">
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
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-left ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500' 
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100/80'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs font-bold text-gray-800">{dateStr}</span>
                              {credit.status === 'partially_paid' && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                                  Partially Paid
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate mt-0.5">{credit.description}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Original Credit: ₱{credit.originalAmount.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-gray-400 block uppercase">Balance</span>
                            <span className="text-sm font-black text-red-600">
                              ₱{credit.remainingBalance.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 block mt-0.5">
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
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Cross-Match Settlement Preview:
                      </span>
                      <span>Total Covered: ₱{paymentPreview.totalCovered.toFixed(2)}</span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-emerald-200/60">
                      {paymentPreview.impacts.map((impact) => {
                        const dateStr = new Date(impact.timestamp).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric'
                        });
                        return (
                          <div 
                            key={impact.creditId}
                            className="flex items-center justify-between text-xs bg-white/80 p-2 rounded-lg border border-emerald-100"
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold text-gray-900">🗓️ {dateStr}: </span>
                              <span className="text-gray-600">{impact.description}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-black text-emerald-700">
                                -₱{impact.amountCovered.toFixed(2)}
                              </span>
                              {impact.willBeFullySettled ? (
                                <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">
                                  Paid in Full!
                                </span>
                              ) : (
                                <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                                  Remaining: ₱{impact.remainingAfter.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {paymentPreview.unallocated > 0.001 && (
                        <div className="text-[11px] text-blue-700 font-semibold pt-1">
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
        <div className="p-6 bg-gray-50/70 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-3.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200/80 transition-all text-sm"
          >
            Cancel
          </button>
          <button
            form="record-form"
            type="submit"
            disabled={isSaving}
            className={`flex-[2] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all text-sm ${
              type === 'credit' 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200 active:scale-95' 
                : 'bg-green-600 hover:bg-green-700 shadow-green-200 active:scale-95'
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
