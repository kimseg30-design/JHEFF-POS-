'use client';

import { useState, useMemo, useDeferredValue } from 'react';
import { useProducts } from '@/lib/hooks/use-products';
import { useBranches } from '@/lib/hooks/use-branches';
import { useAuth } from '@/lib/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { ProductList } from '@/components/inventory/product-list';
import { ProductForm } from '@/components/inventory/product-form';
import { CsvImport } from '@/components/inventory/csv-import';
import { ConfirmModal } from '@/components/ui/modal';
import { Plus, Search, Package, ArrowLeft, Upload, Download, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/lib/db/idb';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function ProductsPage() {
  const { currentBranchId, loading: loadingBranches } = useBranches();
  const { isAdmin, isCashier } = useAuth();
  const { products, loading, addProduct, addProducts, updateProduct, deleteProduct } = useProducts(currentBranchId || undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!loadingBranches && !currentBranchId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center border border-gray-100 shadow-xl shadow-gray-200/50">
            <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-red-600">
              <Package className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase mb-4">No Branch Access</h2>
            <p className="text-gray-500 font-medium leading-relaxed mb-8">
              You haven&apos;t been assigned to any branches yet. Please contact your administrator to get access.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const deferredSearch = useDeferredValue(searchQuery);

  const filteredProducts = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [products, deferredSearch]);

  const handleExport = async () => {
    const exportData = filteredProducts.map(p => ({
      name: p.name,
      price: p.price,
      qty: p.stock,
      total: p.price * p.stock,
      date: new Date(p.createdAt).toLocaleDateString()
    }));

    const Papa = (await import('papaparse')).default;
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (product: Product) => {
    if (!isAdmin) return;
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleSave = async (data: any) => {
    if (!isAdmin) return;
    if (editingProduct) {
      await updateProduct(data);
    } else {
      await addProduct({ ...data, branchId: currentBranchId! });
    }
  };

  const handleBulkImport = async (data: any[]) => {
    if (!isAdmin || !currentBranchId) return;
    const productsWithBranch = data.map(p => ({ ...p, branchId: currentBranchId }));
    await addProducts(productsWithBranch);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteProduct(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory</h2>
                <p className="text-gray-500 font-medium">Manage your store products and stock.</p>
              </div>
            </div>
  
            {!isCashier && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExport}
                  className="bg-white hover:bg-gray-50 text-gray-900 font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 border border-gray-200 shadow-sm transition-all active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  Export CSV
                </button>
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="bg-white hover:bg-gray-50 text-gray-900 font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 border border-gray-200 shadow-sm transition-all active:scale-95"
                >
                  <Upload className="w-5 h-5" />
                  Import CSV
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsFormOpen(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Add New Product
                </button>
              </div>
            )}
          </div>
  
          {isCashier && (
            <div className="mb-8 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-4 text-blue-900">
              <div className="bg-blue-600 p-3 rounded-2xl text-white">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-[10px] mb-1 opacity-70">Cashier Mode</p>
                <p className="font-bold">You have read-only access to the inventory. Product editing is disabled.</p>
              </div>
            </div>
          )}
  
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
  
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin border-4 border-orange-200 border-t-orange-600 rounded-full w-12 h-12 mb-4" />
              <p className="text-gray-500 font-medium">Loading inventory...</p>
            </div>
          ) : (
            <ProductList 
              products={filteredProducts} 
              onEdit={isAdmin ? handleEdit : undefined} 
              onDelete={isAdmin ? handleDelete : undefined} 
            />
          )}
        </div>
  
        {isFormOpen && (
          <ProductForm 
            product={editingProduct}
            onSave={handleSave}
            onClose={() => setIsFormOpen(false)}
          />
        )}
        
        {isImportOpen && (
          <CsvImport 
            onImport={handleBulkImport}
            onClose={() => setIsImportOpen(false)}
          />
        )}
  
        <ConfirmModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={confirmDelete}
          title="Delete Product"
          message="Are you sure you want to delete this product? This action cannot be undone."
          variant="danger"
          confirmText="Delete"
        />
      </div>
    </AuthGuard>
  );
}
