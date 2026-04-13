'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { MagicCard } from '@/components/shadcn/magic-card';
import { ShimmerButton } from '@/components/shadcn/shimmer-button';
import { DataTable, Pagination, LoadingSpinner, EmptyState } from '@/components/ui';
import { Store, Search, ArrowUpDown, ShoppingCart, Package, ArrowLeft, Star, TrendingDown } from 'lucide-react';
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

  return (
    <div className="p-6 space-y-6 bg-white dark:bg-surface-900 min-h-screen">
      {/* Page Title */}
      <BlurFade delay={0.05}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Supplier Catalog</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Browse and compare products across all suppliers
            </p>
          </div>
          {compareMode && (
            <motion.button
              onClick={() => setCompareMode(false)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-xl border border-surface-200 dark:border-surface-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Catalog
            </motion.button>
          )}
        </div>
      </BlurFade>

      {/* Search */}
      <BlurFade delay={0.1}>
        <div className="flex items-center gap-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 w-full sm:w-96 shadow-sm">
          <Search className="w-4 h-4 text-surface-400 dark:text-surface-500" />
          <input
            type="text"
            placeholder="Search products across all suppliers..."
            className="bg-transparent text-sm outline-none flex-1 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </BlurFade>

      {/* Compare View */}
      <AnimatePresence mode="wait">
        {compareMode && compareResults.length > 0 ? (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <BlurFade delay={0.15}>
              <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 rounded-t-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-surface-800 dark:text-surface-100">Price Comparison: {compareProductName}</h4>
                    <p className="text-xs text-surface-400 dark:text-surface-500">{compareResults.length} suppliers found</p>
                  </div>
                </div>
                <div className="divide-y divide-surface-100 dark:divide-surface-700">
                  {compareResults.map((item: any, i: number) => (
                    <motion.div
                      key={item.supplier_product_id || i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                      className="px-5 py-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {i === 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                            <Star className="w-3 h-3" /> Best Price
                          </span>
                        )}
                        {item.is_preferred && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            Preferred
                          </span>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{item.supplier_name}</p>
                          <p className="text-xs text-surface-400 dark:text-surface-500">{(item.quantity_available || 0).toLocaleString()} available</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={cn('font-bold', i === 0 ? 'text-brand-600 dark:text-brand-400' : 'text-surface-700 dark:text-surface-300')}>
                          {formatCurrency(item.unit_price)}
                        </p>
                        {i > 0 && compareResults[0] && (
                          <p className="text-xs text-danger-500 dark:text-danger-400">
                            +{formatCurrency(item.unit_price - compareResults[0].unit_price)}
                          </p>
                        )}
                        <ShimmerButton
                          className="h-8 px-3 text-xs"
                          shimmerSize="0.04em"
                          shimmerColor="rgba(255,255,255,0.6)"
                          background="rgba(79,70,229,1)"
                        >
                          <span className="flex items-center gap-1.5 text-white text-xs font-semibold">
                            <ShoppingCart className="w-3 h-3" /> Add to Order
                          </span>
                        </ShimmerButton>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </BlurFade>
          </motion.div>
        ) : (
          /* Product Cards Grid View */
          <motion.div
            key="catalog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner />
              </div>
            ) : catalog.length === 0 ? (
              <BlurFade delay={0.15}>
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700 flex items-center justify-center mb-4">
                    <Store className="w-9 h-9 text-surface-400 dark:text-surface-500" />
                  </div>
                  <p className="text-base font-semibold text-surface-700 dark:text-surface-200 mb-1">
                    No supplier products found
                  </p>
                  <p className="text-sm text-surface-400 dark:text-surface-500 max-w-xs text-center">
                    Distributors need to list their products first.
                  </p>
                </div>
              </BlurFade>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {catalog.map((item, i) => (
                    <BlurFade key={item.id || i} delay={0.08 + i * 0.04}>
                      <MagicCard
                        className="relative bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl p-5 cursor-pointer group"
                        gradientColor="rgba(79,70,229,0.08)"
                      >
                        {/* Product Info */}
                        <div className="mb-4">
                          <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-3">
                            <Package className="w-5 h-5 text-surface-500 dark:text-surface-400" />
                          </div>
                          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-50 leading-tight mb-1 line-clamp-2">
                            {item.product?.name || 'Unknown'}
                          </h3>
                          <p className="text-xs text-surface-400 dark:text-surface-500 line-clamp-1">
                            {item.product?.generic_name || ''}{item.product?.strength ? ` · ${item.product.strength}` : ''}
                          </p>
                          {item.product?.manufacturer && (
                            <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                              {item.product.manufacturer}
                            </p>
                          )}
                        </div>

                        {/* Price + Availability */}
                        <div className="flex items-end justify-between mb-4">
                          <div>
                            <p className="text-xs text-surface-400 dark:text-surface-500 mb-0.5">Price/Unit</p>
                            <p className="text-lg font-bold text-surface-900 dark:text-surface-50 tabular-nums">
                              {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                          <span className={cn(
                            'text-xs font-semibold px-2 py-1 rounded-lg',
                            item.quantity_available < 100
                              ? 'bg-warning-500/10 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
                          )}>
                            {(item.quantity_available || 0).toLocaleString()} avail
                          </span>
                        </div>

                        {/* Hover-reveal details + actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCompare(item.product_id, item.product?.name || '')}
                            className="flex-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-xl py-2 px-3 transition-colors text-center"
                          >
                            <ArrowUpDown className="w-3 h-3 inline mr-1" />
                            Compare
                          </button>
                          <ShimmerButton
                            className="flex-1 h-[34px] rounded-xl text-xs"
                            shimmerSize="0.04em"
                            shimmerColor="rgba(255,255,255,0.5)"
                            background="rgba(79,70,229,1)"
                          >
                            <span className="flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                              <ShoppingCart className="w-3 h-3" /> Add to Order
                            </span>
                          </ShimmerButton>
                        </div>
                      </MagicCard>
                    </BlurFade>
                  ))}
                </div>

                <div className="mt-6">
                  <Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
