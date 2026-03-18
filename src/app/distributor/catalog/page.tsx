'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { DataTable, Pagination, Modal, LoadingSpinner } from '@/components/ui';
import { Plus, Search, Edit, Eye, EyeOff } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { catalogApi, productsApi } from '@/lib/api';
import type { SupplierProduct, Product, PaginatedResponse } from '@/types';

export default function DistributorCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<SupplierProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addPrice, setAddPrice] = useState('');
  const [addStock, setAddStock] = useState('');
  const [addPublished, setAddPublished] = useState(true);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<SupplierProduct | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editPublished, setEditPublished] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadCatalog = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res: PaginatedResponse<SupplierProduct> = await catalogApi.listMyProducts(p);
      setCatalog(res.items);
      setPage(res.page);
      setTotalPages(res.pages);
      setTotalItems(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCatalog(1); }, [loadCatalog]);

  useEffect(() => {
    if (!globalSearch.trim()) { setGlobalResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await productsApi.list(1, globalSearch);
        setGlobalResults(res.items);
      } catch { setGlobalResults([]); }
      finally { setSearchLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  const handleAddProduct = async () => {
    if (!selectedProduct) return;
    const price = parseFloat(addPrice);
    const stock = parseInt(addStock, 10);
    if (isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
      setAddError('Please enter a valid price and stock quantity.');
      return;
    }
    setAddSaving(true);
    setAddError(null);
    try {
      await catalogApi.createProduct({ product_id: selectedProduct.id, unit_price: price, quantity_available: stock, is_published: addPublished });
      setShowAddModal(false);
      setSelectedProduct(null);
      setGlobalSearch('');
      setAddPrice('');
      setAddStock('');
      setAddPublished(true);
      loadCatalog(page);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add product');
    } finally {
      setAddSaving(false);
    }
  };

  const openEdit = (item: SupplierProduct) => {
    setEditingItem(item);
    setEditPrice(String(item.unit_price));
    setEditStock(String(item.quantity_available));
    setEditPublished(item.is_published);
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editingItem) return;
    const price = parseFloat(editPrice);
    const stock = parseInt(editStock, 10);
    if (isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
      setEditError('Please enter a valid price and stock quantity.');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await catalogApi.updateProduct(editingItem.id, { unit_price: price, quantity_available: stock, is_published: editPublished });
      setEditingItem(null);
      loadCatalog(page);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update product');
    } finally {
      setEditSaving(false);
    }
  };

  const publishedCount = catalog.filter((p) => p.is_published).length;
  const totalStock = catalog.reduce((sum, p) => sum + p.quantity_available, 0);

  const columns = [
    {
      key: 'product_name',
      header: 'Product',
      render: (item: SupplierProduct) => (
        <div>
          <p className="font-semibold text-surface-800">{item.product?.name || 'Unknown'}</p>
          <p className="text-xs text-surface-400">{item.product?.manufacturer || ''} · {item.product?.strength || ''}</p>
        </div>
      ),
    },
    {
      key: 'unit_price',
      header: 'Unit Price',
      render: (item: SupplierProduct) => <span className="font-semibold">{formatCurrency(item.unit_price)}</span>,
    },
    {
      key: 'quantity_available',
      header: 'Stock',
      render: (item: SupplierProduct) => (
        <span className={cn('font-semibold', item.quantity_available < 1000 ? 'text-warning-600' : 'text-surface-800')}>
          {item.quantity_available.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'is_published',
      header: 'Visibility',
      render: (item: SupplierProduct) => item.is_published ? (
        <span className="badge bg-brand-100 text-brand-700 flex items-center gap-1 w-fit"><Eye className="w-3 h-3" /> Published</span>
      ) : (
        <span className="badge bg-surface-200 text-surface-500 flex items-center gap-1 w-fit"><EyeOff className="w-3 h-3" /> Hidden</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: SupplierProduct) => (
        <button onClick={() => openEdit(item)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <Edit className="w-3 h-3" /> Edit
        </button>
      ),
    },
  ];

  return (
    <>
      <Header title="My Product Catalog" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5"><p className="text-sm text-surface-500">Total Products</p><p className="text-2xl font-extrabold text-surface-900 mt-1">{totalItems}</p></div>
          <div className="card p-5"><p className="text-sm text-surface-500">Published</p><p className="text-2xl font-extrabold text-brand-600 mt-1">{publishedCount}</p></div>
          <div className="card p-5"><p className="text-sm text-surface-500">Total Stock Units</p><p className="text-2xl font-extrabold text-surface-900 mt-1">{totalStock.toLocaleString()}</p></div>
        </div>

        {error && <div className="card p-4 border-danger-500/30 bg-danger-500/5 text-danger-700 text-sm font-semibold">{error}</div>}

        <div className="card">
          <div className="px-5 py-4 border-b border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-surface-400">Page {page} of {totalPages} · {totalItems} products</div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm" style={{ background: '#2563eb' }}>
              <Plus className="w-4 h-4" /> Add Product to Catalog
            </button>
          </div>
          <DataTable columns={columns} data={catalog} loading={loading} />
          <Pagination page={page} pages={totalPages} total={totalItems} onPageChange={(p) => loadCatalog(p)} />
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setSelectedProduct(null); setGlobalSearch(''); setAddError(null); }} title="Add Product to Your Catalog">
        <div className="space-y-4">
          <div>
            <label className="label">Search Global Product Catalog</label>
            <input className="input" placeholder="Search by name, e.g. Paracetamol 500mg..." value={globalSearch} onChange={(e) => { setGlobalSearch(e.target.value); setSelectedProduct(null); }} />
          </div>
          <div className="bg-surface-50 border border-surface-200 rounded-xl p-3 min-h-[80px] max-h-[200px] overflow-y-auto">
            {searchLoading ? <div className="flex items-center justify-center py-4"><LoadingSpinner /></div> : selectedProduct ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-surface-800">{selectedProduct.name}</p>
                  <p className="text-xs text-surface-400">{selectedProduct.manufacturer} · {selectedProduct.strength}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-xs text-danger-500 font-semibold">Change</button>
              </div>
            ) : globalResults.length > 0 ? (
              <div className="divide-y divide-surface-200">
                {globalResults.map((product) => (
                  <button key={product.id} onClick={() => setSelectedProduct(product)} className="w-full text-left px-2 py-2 hover:bg-surface-100 rounded transition-colors">
                    <p className="text-sm font-medium text-surface-800">{product.name}</p>
                    <p className="text-xs text-surface-400">{product.manufacturer} · {product.strength}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400 text-center py-4">{globalSearch ? 'No products found' : 'Search and select a product above'}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Your Unit Price (₦)</label><input type="number" className="input" placeholder="0.00" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} /></div>
            <div><label className="label">Available Stock</label><input type="number" className="input" placeholder="0" value={addStock} onChange={(e) => setAddStock(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="published" checked={addPublished} onChange={(e) => setAddPublished(e.target.checked)} className="rounded" />
            <label htmlFor="published" className="text-sm text-surface-600">Publish to pharmacies immediately</label>
          </div>
          {addError && <p className="text-sm text-danger-600 font-semibold">{addError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowAddModal(false); setSelectedProduct(null); setGlobalSearch(''); setAddError(null); }} className="btn-secondary text-sm">Cancel</button>
            <button onClick={handleAddProduct} disabled={!selectedProduct || addSaving} className="btn-primary text-sm disabled:opacity-50" style={{ background: '#2563eb' }}>
              {addSaving ? 'Adding...' : 'Add to My Catalog'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editingItem} onClose={() => { setEditingItem(null); setEditError(null); }} title="Update Product">
        {editingItem && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="font-semibold text-surface-800">{editingItem.product?.name || 'Unknown'}</p>
              <p className="text-xs text-surface-400">{editingItem.product?.manufacturer || ''} · {editingItem.product?.strength || ''}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Unit Price (₦)</label><input type="number" className="input" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} /></div>
              <div><label className="label">Available Stock</label><input type="number" className="input" value={editStock} onChange={(e) => setEditStock(e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-published" checked={editPublished} onChange={(e) => setEditPublished(e.target.checked)} className="rounded" />
              <label htmlFor="edit-published" className="text-sm text-surface-600">Published to pharmacies</label>
            </div>
            {editError && <p className="text-sm text-danger-600 font-semibold">{editError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setEditingItem(null); setEditError(null); }} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving} className="btn-primary text-sm disabled:opacity-50" style={{ background: '#2563eb' }}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
