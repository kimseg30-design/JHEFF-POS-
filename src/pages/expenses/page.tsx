'use client';

import { useState } from 'react';
import { useExpenses } from '@/lib/hooks/use-expenses';
import { useBranches } from '@/lib/hooks/use-branches';
import { useAuth } from '@/lib/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { 
  Plus, Search, ArrowLeft, Loader2, FileText, Calendar, 
  Trash2, TrendingDown, DollarSign, Tag, User, Receipt
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Expense } from '@/lib/db/idb';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function ExpensesPage() {
  const { currentBranchId, loading: loadingBranches } = useBranches();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { expenses, loading, addExpense, deleteExpense } = useExpenses(currentBranchId || undefined);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<'Utilities' | 'Rent' | 'Salary' | 'Inventory Restock' | 'Snacks / Refreshments' | 'Marketing' | 'Others'>('Others');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        description,
        amount: parseFloat(amount),
        category,
        referenceNumber: referenceNumber.trim() || undefined,
        createdBy: user?.name || user?.email || 'System'
      });
      // Reset form
      setDescription('');
      setAmount('');
      setCategory('Others');
      setReferenceNumber('');
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to add expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading || loadingBranches) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!currentBranchId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans transition-colors">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[3rem] p-12 text-center border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
            <div className="w-24 h-24 bg-red-50 dark:bg-rose-950/40 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600 dark:text-rose-400">
              <TrendingDown className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-950 dark:text-white tracking-tight uppercase mb-4">No Branch Access</h2>
            <p className="text-gray-600 dark:text-gray-300 font-bold leading-relaxed mb-8">
              You haven&apos;t been assigned to any branches yet. Please contact your administrator to get access.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-md shadow-orange-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Categories for select and badges
  const categories = [
    'Utilities',
    'Rent',
    'Salary',
    'Inventory Restock',
    'Snacks / Refreshments',
    'Marketing',
    'Others'
  ];

  const categoryColors: Record<string, { bg: string; text: string }> = {
    'Utilities': { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300' },
    'Rent': { bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300' },
    'Salary': { bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300' },
    'Inventory Restock': { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300' },
    'Snacks / Refreshments': { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300' },
    'Marketing': { bg: 'bg-pink-50 dark:bg-pink-950/60', text: 'text-pink-700 dark:text-pink-300' },
    'Others': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.referenceNumber && e.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenseSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans transition-colors">
        <Header />
        
        <div className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-6">
                <Link 
                  href="/"
                  className="p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-[1.5rem] transition-all text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                  <h2 className="text-4xl font-black text-gray-950 dark:text-white tracking-tighter leading-tight">Expenses System</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 font-bold">Record and track operation costs, bills, salaries and snacks.</p>
                </div>
              </div>
  
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="w-full md:w-auto bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black px-8 py-5 rounded-[2rem] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-xl shadow-red-500/20 cursor-pointer border-none"
              >
                <Plus className="w-5 h-5" />
                Log Expense
              </button>
            </div>

            {/* Total Expense Summary card */}
            <div className="bg-red-50 dark:bg-rose-950/30 p-8 rounded-[3rem] border border-red-100 dark:border-rose-900/40 flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-red-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-red-500/20">
                  <TrendingDown className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-red-900/70 dark:text-rose-300/80 font-black text-xs uppercase tracking-widest mb-1">Total Expenses Shown</p>
                  <p className="text-red-950 dark:text-rose-200 font-black text-4xl tracking-tight">
                    ₱{totalExpenseSum.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <p className="text-red-900 dark:text-rose-300 font-bold text-sm text-center sm:text-right max-w-xs leading-relaxed">
                Reflected in Daily Summary and Profit & Loss calculations.
              </p>
            </div>

            {/* Filter & Search Controls */}
            <div className="flex flex-col md:flex-row gap-6 mb-8 items-stretch md:items-center justify-between">
              {/* Category selector */}
              <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto max-w-full">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${
                    selectedCategory === 'all' 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm flex items-center pl-6">
                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
                <input
                  type="text"
                  placeholder="Search description, reference no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none py-4 text-sm font-bold text-gray-950 dark:text-white pr-6 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden transition-colors">
              {filteredExpenses.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400 dark:text-gray-500">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-gray-950 dark:text-white mb-2">No Expenses Found</h3>
                  <p className="text-gray-600 dark:text-gray-300 font-medium max-w-md mx-auto">
                    No expense items match your filters, or no expenses have been logged for this branch yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-850">
                        <th className="py-6 px-8 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">Date & Time</th>
                        <th className="py-6 px-8 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">Category</th>
                        <th className="py-6 px-8 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">Description</th>
                        <th className="py-6 px-8 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">Ref No.</th>
                        <th className="py-6 px-8 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">Log By</th>
                        <th className="py-6 px-8 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 text-right">Amount</th>
                        <th className="py-6 px-8 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredExpenses.map((expense) => {
                        const colColors = categoryColors[expense.category] || categoryColors['Others'];
                        return (
                          <tr key={expense.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="py-5 px-8 font-bold text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                {new Date(expense.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                {new Date(expense.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-5 px-8 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${colColors.bg} ${colColors.text}`}>
                                <Tag className="w-3 h-3" />
                                {expense.category}
                              </span>
                            </td>
                            <td className="py-5 px-8 font-black text-gray-950 dark:text-white max-w-xs truncate">
                              {expense.description}
                            </td>
                            <td className="py-5 px-8 font-mono text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {expense.referenceNumber ? (
                                <span className="flex items-center gap-1.5">
                                  <Receipt className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                  {expense.referenceNumber}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 font-bold">N/A</span>
                              )}
                            </td>
                            <td className="py-5 px-8 font-bold text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                {expense.createdBy}
                              </span>
                            </td>
                            <td className="py-5 px-8 font-black text-right text-red-600 dark:text-rose-400 text-base whitespace-nowrap">
                              ₱{expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-5 px-8 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this expense?')) {
                                    deleteExpense(expense.id);
                                  }
                                }}
                                className="p-3 text-gray-400 hover:text-red-600 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                                title="Delete expense"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal form for adding expense */}
        <AnimatePresence>
          {isFormOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl max-w-lg w-full p-8 md:p-10 border border-gray-100 dark:border-gray-800 relative text-left transition-colors"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-red-100 dark:bg-rose-950/60 text-red-600 dark:text-rose-400 rounded-2xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight leading-tight uppercase">Log Operational Cost</h3>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Record a store expense immediately.</p>
                  </div>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. June Meralco Bill, Store Supplies"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 outline-none font-bold text-gray-950 dark:text-white text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-red-100 dark:focus:ring-rose-950 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">Amount (₱) *</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 outline-none font-bold text-gray-950 dark:text-white text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-red-100 dark:focus:ring-rose-950 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 outline-none font-bold text-gray-950 dark:text-white text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-red-100 dark:focus:ring-rose-950 transition-all cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">Reference Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Receipt No., Bill Invoice No."
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-6 py-4 outline-none font-bold text-gray-950 dark:text-white text-sm focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-red-100 dark:focus:ring-rose-950 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-500/20 cursor-pointer uppercase tracking-wider text-xs border-none flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Logging...
                        </>
                      ) : (
                        'Save Expense'
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-black py-4.5 rounded-2xl transition-all cursor-pointer uppercase tracking-wider text-xs border-none text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
