'use client';

import React, { useState, useMemo, useEffect, useCallback, useDeferredValue, useRef } from 'react';
import { useProducts } from '@/lib/hooks/use-products';
import { useCart } from '@/lib/hooks/use-cart';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useTicket } from '@/lib/hooks/use-ticket';
import { useEWallet } from '@/lib/hooks/use-ewallet';
import { useBranches } from '@/lib/hooks/use-branches';
import { useStore } from '@/lib/hooks/use-store';
import { useReceipt } from '@/lib/context/receipt-context';
import { useCustomers } from '@/lib/hooks/use-customers';
import { Product } from '@/lib/db/idb';
import { auditService } from '@/lib/services/audit-service';
import { Header } from '@/components/layout/header';
import { QuickAdd } from '@/components/pos/quick-add';
import { EWalletModal } from '@/components/pos/ewallet-modal';
import { ProductCard } from '@/components/pos/product-card';
import { CartItem } from '@/components/pos/cart-item';
import { CheckoutSummary } from '@/components/pos/checkout-summary';
import { CheckoutModal, CheckoutResult } from '@/components/pos/checkout-modal';
import { SuccessOverlay } from '@/components/pos/success-overlay';
import { 
  Search, 
  ShoppingCart, 
  ArrowLeft,
  PackageOpen,
  X,
  Filter,
  History,
  Wallet,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function POSPage() {
  const { currentBranchId, currentBranch, loading: loadingBranches } = useBranches();
  const { store, getNextORNumber, products, addProduct } = useStore();
  const { updateProduct, refresh } = useProducts(currentBranchId || undefined);
  const { cart, addToCart, updateQuantity, setItemQuantity, removeFromCart, clearCart, total } = useCart();
  const { customers, addCustomer, recordCredit } = useCustomers(currentBranchId || undefined);
  const { addTransaction } = useTransactions(currentBranchId || undefined);
  const { currentTicket, rotateTicket } = useTicket(currentBranchId || undefined);
  const { addTransaction: addEWalletTransaction } = useEWallet(currentBranchId || undefined);
  const { showReceipt } = useReceipt();
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const POS_ITEMS_PER_PAGE = 20; // 5 columns x 4 rows pagination
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEWalletOpen, setIsEWalletOpen] = useState(false);
  const [completedTicket, setCompletedTicket] = useState<string>('');
  const [showCartMobile, setShowCartMobile] = useState(false);

  // Keyboard shortcut to instantly access search: '/' or 'Ctrl+K' / 'Cmd+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset to page 1 whenever search query or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, selectedCategory]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return cats.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    return products.filter(p => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, deferredSearch, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / POS_ITEMS_PER_PAGE));

  const visibleProducts = useMemo(() => {
    const start = (currentPage - 1) * POS_ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + POS_ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage, POS_ITEMS_PER_PAGE]);

  const handleAddToCart = useCallback((product: Product) => {
    addToCart(product);
  }, [addToCart]);

  const handleQuickAdd = async (name: string, price: number) => {
    if (price <= 0 || !currentBranchId) return;
    
    try {
      const newProduct = await addProduct({
        name: name || 'Quick Item',
        price,
        cost: 0,
        stock: 999,
        category: 'Quick Add',
        branchId: currentBranchId,
      });
      addToCart(newProduct);
    } catch (error) {
      console.error('Quick add failed:', error);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0 || !currentBranchId) return;
    setIsCheckoutModalOpen(true);
  };

  const handleAddNewCustomerInline = async (name: string, contact: string) => {
    if (!currentBranchId) return undefined;
    return await addCustomer({
      name,
      contact,
    });
  };

  const handleConfirmCheckout = async (result: CheckoutResult) => {
    if (cart.length === 0 || isCheckingOut || !currentBranchId) return;
    
    setIsCheckingOut(true);
    try {
      const now = Date.now();
      const ticketToFinalize = currentTicket;
      const orNumber = await getNextORNumber();
      
      // Calculate VAT if enabled
      let vatableSales = 0;
      let vatAmount = 0;
      if (store?.taxType === 'VAT') {
        const rate = (store.vatRate || 12) / 100;
        vatableSales = total / (1 + rate);
        vatAmount = total - vatableSales;
      }

      // 1. Process credit account balances
      if (result.paymentMethod === 'credit' && result.customerId) {
        await recordCredit(
          result.customerId,
          total,
          `POS Ticket ${ticketToFinalize} (Credit Purchase)`,
          'credit',
          undefined,
          now
        );
      } else if (result.paymentMethod === 'split' && result.paymentDetails.splitBreakdown) {
        for (const portion of result.paymentDetails.splitBreakdown) {
          if (portion.method === 'credit' && portion.amount > 0 && portion.customerId) {
            await recordCredit(
              portion.customerId,
              portion.amount,
              `POS Ticket ${ticketToFinalize} (Split Credit Portion)`,
              'credit',
              undefined,
              now
            );
          }
        }
      }

      // 2. Create transaction as a ticket with payment mode details
      await addTransaction({
        ticketNumber: ticketToFinalize,
        orNumber,
        items: cart,
        total,
        vatableSales,
        vatAmount,
        taxType: store?.taxType || 'NON-VAT',
        timestamp: now,
        branchId: currentBranchId,
        customerId: result.customerId,
        customerName: result.customerName,
        paymentMethod: result.paymentMethod,
        amountPaid: result.amountPaid,
        change: result.change,
        paymentDetails: result.paymentDetails,
      });

      await auditService.log('TRANSACTION_COMPLETE', JSON.stringify({
        ticketNumber: ticketToFinalize,
        orNumber,
        total,
        itemsCount: cart.length,
        paymentMethod: result.paymentMethod,
        amountPaid: result.amountPaid,
        change: result.change,
      }));

      // 3. Update stock
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await updateProduct({
            ...product,
            stock: Math.max(0, product.stock - item.quantity),
            updatedAt: now,
          });
        }
      }

      setCompletedTicket(ticketToFinalize);
      setIsCheckoutModalOpen(false);

      showReceipt({
        ticketNumber: ticketToFinalize,
        orNumber,
        timestamp: now,
        items: [...cart],
        total,
        vatableSales,
        vatAmount,
        taxType: store?.taxType || 'NON-VAT',
        paymentMethod: result.paymentMethod,
        amountPaid: result.amountPaid,
        change: result.change,
        customerName: result.customerName,
        splitBreakdown: result.paymentDetails.splitBreakdown,
        paymentDetails: result.paymentDetails,
        type: 'sales'
      }, async () => {
        // Automatically create a new empty ticket by rotating after receipt is closed
        await rotateTicket();
      });
      
      clearCart();
      setShowCartMobile(false);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to complete checkout. Please check the logs.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleEWalletSave = async (data: any) => {
    if (!currentBranchId) return;
    const now = Date.now();
    const ticketNum = `EW-${Math.floor(1000 + Math.random() * 9000)}`;
    const orNumber = await getNextORNumber();
    
    await addEWalletTransaction({
      ...data,
      orNumber,
      branchId: currentBranchId,
    });

    showReceipt({
      ticketNumber: ticketNum,
      orNumber,
      timestamp: now,
      items: [{ name: `${data.type.replace('_', ' ')} - ${data.method}`, qty: 1, price: data.amount }],
      total: data.amount,
      paymentMethod: 'e-wallet',
      type: 'ewallet',
      ewalletDetails: {
        type: data.type.replace('_', ' '),
        method: data.method,
        fee: data.fee,
        customerName: data.customerName,
        referenceNumber: data.referenceNumber
      }
    });

    await auditService.log('TRANSACTION_COMPLETE', JSON.stringify({
      ticketNumber: currentTicket,
      orNumber,
      total: data.amount + data.fee,
      type: 'ewallet',
      ewalletType: data.type,
      method: data.method,
      paymentMethod: 'e-wallet'
    }));
    
    setIsEWalletOpen(false);
  };

  if (!loadingBranches && !currentBranchId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans transition-colors">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-[3rem] p-12 text-center border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
            <div className="w-24 h-24 bg-red-50 dark:bg-rose-950/40 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600 dark:text-red-400">
              <MapPin className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase mb-4">No Branch Access</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8">
              You haven&apos;t been assigned to any branches yet. Please contact your administrator to get access.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans transition-colors">
        <Header ticketNumber={currentTicket} />
        
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Product Selection Area */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Link 
                      href="/"
                      className="p-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-gray-800 shadow-sm"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Checkout</h2>
                        {currentBranch && (
                          <span className="bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {currentBranch.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select items for transaction</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <QuickAdd onAdd={handleQuickAdd} />
                    <button
                      onClick={() => setIsEWalletOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all text-white shadow-lg shadow-blue-100 dark:shadow-none font-black text-xs uppercase tracking-widest cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      E-Wallet
                    </button>
                    <Link
                      href="/pos/history"
                      className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 shadow-sm font-black text-xs uppercase tracking-widest"
                    >
                      <History className="w-4 h-4" />
                      History
                    </Link>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Highly Accessible Search Input with Shortcut and Clear Button */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products or categories... (Press / to search)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-20 py-4 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-[2rem] border-2 border-gray-300 dark:border-gray-700 shadow-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all text-base sm:text-lg font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            searchInputRef.current?.focus();
                          }}
                          className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-black text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xs">
                          /
                        </kbd>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border cursor-pointer ${
                        !selectedCategory 
                          ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950 border-gray-950 dark:border-white shadow-lg' 
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                      }`}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950 border-gray-950 dark:border-white shadow-lg' 
                            : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
  
              {filteredProducts.length === 0 ? (
                <div className="text-center py-32 bg-white dark:bg-gray-900 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800 shadow-inner">
                  <PackageOpen className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">No products found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Try searching for something else or add a new product.</p>
                </div>
              ) : (
                <div className="space-y-6 pb-24 lg:pb-0">
                  {/* 5 columns x 4 rows POS Product Display Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-3.5 sm:gap-4">
                    {visibleProducts.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAdd={handleAddToCart} 
                      />
                    ))}
                  </div>

                  {/* 5x4 Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Showing <span className="text-orange-600 dark:text-orange-400 font-black">{(currentPage - 1) * POS_ITEMS_PER_PAGE + 1} - {Math.min(currentPage * POS_ITEMS_PER_PAGE, filteredProducts.length)}</span> of <span className="text-gray-950 dark:text-white font-black">{filteredProducts.length}</span> products · <span className="text-gray-500 dark:text-gray-400 font-bold">5×4 Display (Page {currentPage} of {totalPages})</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 rounded-xl font-black text-xs uppercase flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Prev</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                            .map((pageNum, idx, arr) => {
                              const prev = arr[idx - 1];
                              const showEllipsis = prev && pageNum - prev > 1;
                              return (
                                <React.Fragment key={pageNum}>
                                  {showEllipsis && <span className="px-1 text-gray-400 font-black">...</span>}
                                  <button
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`min-w-9 h-9 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                      currentPage === pageNum
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        <button
                          type="button"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 rounded-xl font-black text-xs uppercase flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
  
          {/* Desktop Cart Sidebar */}
          <div className="hidden lg:flex w-[450px] bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex-col shadow-2xl relative z-10 transition-colors">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
              <div className="flex items-center gap-4">
                <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-lg shadow-orange-100 dark:shadow-none">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Cart</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Review items before checkout</p>
                </div>
              </div>
              <span className="bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-sm font-black px-4 py-1.5 rounded-full">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} ITEMS
              </span>
            </div>
  
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <AnimatePresence mode="popLayout">
                {cart.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center text-gray-300 dark:text-gray-600"
                  >
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-8 rounded-[3rem] mb-6">
                      <ShoppingCart className="w-16 h-16 opacity-20" />
                    </div>
                    <p className="font-black text-xl text-gray-400 dark:text-gray-500 uppercase tracking-tight">Cart is empty</p>
                    <p className="text-sm mt-2 max-w-[200px] mx-auto text-gray-400 dark:text-gray-500">Select products from the grid to start a transaction</p>
                  </motion.div>
                ) : (
                  cart.map((item) => (
                    <CartItem 
                      key={item.productId} 
                      item={item} 
                      onUpdateQuantity={updateQuantity} 
                      onSetQuantity={setItemQuantity}
                      onRemove={removeFromCart} 
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
  
            <CheckoutSummary 
              total={total} 
              itemCount={cart.length} 
              onCheckout={handleCheckout} 
              disabled={cart.length === 0 || isCheckingOut} 
              isCheckingOut={isCheckingOut} 
            />
          </div>
  
          {/* Mobile Cart Toggle Button */}
          <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCartMobile(true)}
              className="w-full bg-gray-900 dark:bg-gray-800 text-white p-6 rounded-[2rem] flex items-center justify-between shadow-2xl shadow-gray-400 dark:shadow-black/60 border border-transparent dark:border-gray-700 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900 dark:border-gray-800">
                      {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </div>
                <span className="font-black text-lg tracking-tight uppercase">View Cart</span>
              </div>
              <span className="text-2xl font-black">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </motion.button>
          </div>
  
          {/* Mobile Cart Overlay */}
          <AnimatePresence>
            {showCartMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col justify-end"
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="bg-white dark:bg-gray-900 rounded-t-[3rem] max-h-[90vh] flex flex-col shadow-2xl border-t border-gray-100 dark:border-gray-800"
                >
                  <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Your Cart</h3>
                    <button 
                      onClick={() => setShowCartMobile(false)}
                      className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 dark:text-gray-400 cursor-pointer"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? (
                      <div className="py-20 text-center text-gray-400 dark:text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest">Cart is empty</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <CartItem 
                          key={item.productId} 
                          item={item} 
                          onUpdateQuantity={updateQuantity} 
                          onSetQuantity={setItemQuantity}
                          onRemove={removeFromCart} 
                        />
                      ))
                    )}
                  </div>
  
                  <div className="p-2">
                    <CheckoutSummary 
                      total={total} 
                      itemCount={cart.length} 
                      onCheckout={handleCheckout} 
                      disabled={cart.length === 0 || isCheckingOut} 
                      isCheckingOut={isCheckingOut} 
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
  
        {/* Checkout Modal */}
        <AnimatePresence>
          {isCheckoutModalOpen && (
            <CheckoutModal
              total={total}
              itemCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
              customers={customers}
              onAddCustomer={handleAddNewCustomerInline}
              onConfirm={handleConfirmCheckout}
              onClose={() => setIsCheckoutModalOpen(false)}
            />
          )}
        </AnimatePresence>

        <SuccessOverlay 
          show={showSuccess} 
          onClose={() => setShowSuccess(false)}
          onViewReceipt={() => {
            setShowSuccess(false);
          }}
          title="Salamat Po!"
          message="Transaction completed successfully. Have a great day!"
          ticketNumber={completedTicket}
        />
  
        <EWalletModal
          isOpen={isEWalletOpen}
          onClose={() => setIsEWalletOpen(false)}
          onSave={handleEWalletSave}
        />
      </div>
    </AuthGuard>
  );
}
