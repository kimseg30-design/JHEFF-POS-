'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/lib/db/idb';
import { productService } from '@/lib/services/product-service';
import { auditService } from '@/lib/services/audit-service';

export function useProducts(branchId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let data: Product[];
      if (branchId) {
        data = await productService.getByBranch(branchId);
      } else {
        data = await productService.getAll();
      }
      
      setProducts(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    await productService.create(newProduct);
    await auditService.log('PRODUCT_ADD', JSON.stringify({ name: product.name, id }));
    await fetchProducts();
    return newProduct;
  };

  const addProducts = async (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>[]) => {
    const now = Date.now();
    const newProducts: Product[] = products.map(p => ({
      ...p,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    }));

    await productService.bulkCreate(newProducts);
    
    await auditService.log('PRODUCT_BULK_ADD', JSON.stringify({ count: newProducts.length }));
    await fetchProducts();
  };

  const updateProduct = async (product: Product) => {
    await productService.update(product);
    await auditService.log('PRODUCT_EDIT', JSON.stringify({ name: product.name, id: product.id }));
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await productService.delete(id);
    await auditService.log('PRODUCT_DELETE', JSON.stringify({ id }));
    await fetchProducts();
  };

  return {
    products,
    loading,
    addProduct,
    addProducts,
    updateProduct,
    deleteProduct,
    refresh: fetchProducts,
  };
}
