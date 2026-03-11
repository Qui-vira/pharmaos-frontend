'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { DataTable, Pagination, LoadingSpinner, EmptyState } from '@/components/ui';
import { Store, Search, ArrowUpDown, ShoppingCart } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { catalogApi } from '@/lib/api';

export default function SuppliersPage() {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<any[]>([]);
  const [compareProductName, setCompareProductName] = useState('');

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const data = await catalogApi.browse(page, search || undefined);
      setCatalog(data.items || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Catalog load error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  // Compare prices for a product (uses product_id, not product_name)
  const handleCompare = async (productId: string, productName: string) => {
    try {
      const results = await catalogApi.compare(productId);
      setCompareResults(results);
      setCompareProductName(productName);
      setCompareMode(true);
    } catch (err: any) {
      alert(err.message || 'Compare failed');
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (item: any) => (
        <div>
          <p className="font-semibold text-surface-800">{item.product?.name || 'Unknown'}</p>
          <p className="text-xs text-surface-400">
            {item.product?.generic_name || ''} · {item.product?.strength || ''} · {item.product?.manufacturer || ''}
          </p>
        </div>
      ),
    },
    {
      key: 'unit_price',
      header: 'Price/Unit',
      render: (item: any) => <span className="font-semibold">{formatCurrency(item.unit_price)}</span>,
    },
    {
      key: 'quantity_available',
      header: 'Available',
      render: (item: any) => (
        <span className={cn('text-sm', item.quantity_available < 100 ? 'text-warning-600' : 'text-surface-600')}>
          {(item.quantity_available || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleCompare(item.product_id, item.product?.name || '')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Compare
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header title="Supplier Catalog" />

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white border border-surface-200 rounded-xl px-3 py-2 w-full sm:w-96 shadow-card">
            <Search className="w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search products across all suppliers..."
              className="bg-transparent text-sm outline-none flex-1"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {compareMode && (
            <button onClick={() => setCompareMode(false)} className="btn-secondary text-sm">
              ← Back to Catalog
            </button>
          )}
        </div>

        {/* Compare View */}
        {compareMode && compareResults.length > 0 ? (
          <div className="card">
            <div className="px-5 py-3 border-b border-surface-200 bg-surface-50 rounded-t-2xl">
              <h4 className="font-bold text-surface-800">Price Comparison: {compareProductName}</h4>
              <p className="text-xs text-surface-400">{compareResults.length} suppliers</p>
            </div>
            <div className="divide-y divide-surface-100">
              {compareResults.map((item: any, i: number) => (
                <div key={item.supplier_product_id || i} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {i === 0 && <span className="badge bg-brand-100 text-brand-700">Best Price</span>}
                    {item.is_preferred && <span className="badge bg-blue-100 text-blue-700">Preferred</span>}
                    <div>
                      <p className="text-sm font-semibold">{item.supplier_name}</p>
                      <p className="text-xs text-surface-400">{(item.quantity_available || 0).toLocaleString()} available</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={cn('font-bold', i === 0 ? 'text-brand-600' : 'text-surface-700')}>
                      {formatCurrency(item.unit_price)}
                    </p>
                    {i > 0 && compareResults[0] && (
                      <p className="text-xs text-danger-500">
                        +{formatCurrency(item.unit_price - compareResults[0].unit_price)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="card">
            {loading ? <LoadingSpinner /> : (
              <>
                <DataTable columns={columns} data={catalog} emptyMessage="No supplier products found. Distributors need to list their products first." />
                <Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
