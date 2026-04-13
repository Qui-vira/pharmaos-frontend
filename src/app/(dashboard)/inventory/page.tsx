'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { StatCard, DataTable, Pagination, Modal, LoadingSpinner } from '@/components/ui';
import { Package, AlertTriangle, TrendingDown, Plus, Search, Calendar, ArrowLeft } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { inventoryApi, productsApi, batchesApi } from '@/lib/api';

type ModalView = 'search' | 'details' | 'create';

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

const stepVariants: Variants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

/* ─── Skeleton Loader ──────────────────────────────────────────────────── */

function InventorySkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5 space-y-3"
          >
            <div className="h-3 w-24 bg-surface-200 dark:bg-surface-700 rounded" />
            <div className="h-7 w-16 bg-surface-200 dark:bg-surface-700 rounded" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <div className="h-5 w-32 bg-surface-200 dark:bg-surface-700 rounded" />
          <div className="h-8 w-28 bg-surface-200 dark:bg-surface-700 rounded-lg" />
        </div>
        <div className="divide-y divide-surface-100 dark:divide-surface-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-surface-200 dark:bg-surface-700 rounded" />
                <div className="h-3 w-56 bg-surface-100 dark:bg-surface-800 rounded" />
              </div>
              <div className="h-4 w-12 bg-surface-200 dark:bg-surface-700 rounded" />
              <div className="h-4 w-16 bg-surface-200 dark:bg-surface-700 rounded" />
              <div className="h-4 w-16 bg-surface-100 dark:bg-surface-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lowStock, setLowStock] = useState<any[]>([]);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<ModalView>('search');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Restock modal (for existing inventory items)
  const [showRestock, setShowRestock] = useState(false);
  const [restockProduct, setRestockProduct] = useState<any>(null);

  // ─── Load ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, low] = await Promise.all([inventoryApi.list(page), inventoryApi.lowStock().catch(() => [])]);
      setInventory(inv.items || []); setTotalPages(inv.pages || 1); setTotal(inv.total || 0);
      setLowStock(low || []);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  // ─── Catalog Search ──────────────────────────────────────────────────

  useEffect(() => {
    if (catalogSearch.length < 2) { setCatalogResults([]); return; }
    const t = setTimeout(async () => {
      setCatalogLoading(true);
      try { const d = await productsApi.list(1, catalogSearch); setCatalogResults(d.items || []); }
      catch { setCatalogResults([]); }
      finally { setCatalogLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [catalogSearch]);

  // ─── Add Product + Stock in ONE step via POST /batches ───────────────

  const handleAddWithStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    try {
      await batchesApi.create({
        product_id: selectedProduct.id,
        batch_number: f.get('batch_number') as string,
        quantity: parseInt(f.get('quantity') as string),
        expiry_date: f.get('expiry_date') as string,
        cost_price: parseFloat(f.get('cost_price') as string) || undefined,
        selling_price: parseFloat(f.get('selling_price') as string) || undefined,
      });
      closeAdd(); load();
    } catch (e: any) { setErr(e.message || 'Failed to add stock'); }
    finally { setBusy(false); }
  };

  // ─── Create New Product then add stock ───────────────────────────────

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    try {
      const product = await productsApi.create({
        name: f.get('name') as string,
        generic_name: (f.get('generic_name') as string) || undefined,
        brand_name: (f.get('brand_name') as string) || undefined,
        dosage_form: (f.get('dosage_form') as string) || undefined,
        strength: (f.get('strength') as string) || undefined,
        manufacturer: (f.get('manufacturer') as string) || undefined,
        nafdac_number: (f.get('nafdac_number') as string) || undefined,
        category: (f.get('category') as string) || undefined,
        requires_prescription: f.get('requires_prescription') === 'true',
        unit_of_measure: (f.get('unit_of_measure') as string) || 'pack',
        reorder_threshold: parseInt(f.get('reorder_threshold') as string) || 10,
      });
      // Now go to details view to add stock
      setSelectedProduct(product);
      setView('details');
      setErr('');
    } catch (e: any) { setErr(e.message || 'Failed to create product'); }
    finally { setBusy(false); }
  };

  // ─── Restock existing item ───────────────────────────────────────────

  const handleRestock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true); setErr('');
    const f = new FormData(e.currentTarget);
    try {
      await batchesApi.create({
        product_id: restockProduct.product_id,
        batch_number: f.get('batch_number') as string,
        quantity: parseInt(f.get('quantity') as string),
        expiry_date: f.get('expiry_date') as string,
        cost_price: parseFloat(f.get('cost_price') as string) || undefined,
        selling_price: parseFloat(f.get('selling_price') as string) || undefined,
      });
      setShowRestock(false); setRestockProduct(null); setErr(''); load();
    } catch (e: any) { setErr(e.message || 'Failed to add batch'); }
    finally { setBusy(false); }
  };

  const closeAdd = () => { setShowAdd(false); setView('search'); setSelectedProduct(null); setCatalogSearch(''); setCatalogResults([]); setErr(''); setBusy(false); };

  const totalValue = inventory.reduce((s, i) => s + (i.quantity_on_hand * parseFloat(i.selling_price || i.cost_price || 0)), 0);

  // ─── Stepper ──────────────────────────────────────────────────────────

  const steps = [
    { key: 'search', label: 'Search' },
    { key: 'details', label: 'Stock Details' },
  ];
  const activeStepIndex = view === 'search' ? 0 : view === 'create' ? 0 : 1;

  // ─── Table ───────────────────────────────────────────────────────────

  const columns = [
  {
    key: 'product',
    header: 'Product',
    render: (i: any) => (
      <div>
        <p className="font-semibold text-surface-800 dark:text-surface-100">
          {i.product?.name || 'Unknown'}
        </p>
        <p className="text-xs text-surface-400 dark:text-surface-500">
          {i.product?.generic_name || ''}
          {i.product?.strength ? ' · ' + i.product.strength : ''}
          {i.product?.category ? ' · ' + i.product.category : ''}
        </p>
      </div>
    ),
  },
  {
    key: 'qty',
    header: 'Stock',
    render: (i: any) => {
      const low = i.quantity_on_hand < i.reorder_threshold;

      return (
        <span className={cn('font-semibold', low ? 'text-danger-500' : 'text-surface-800 dark:text-surface-100')}>
          {i.quantity_on_hand}

          {i.quantity_reserved > 0 && (
            <span className="ml-1 text-xs text-warning-600 dark:text-warning-400">
              ({i.quantity_reserved} reserved)
            </span>
          )}

          {low && (
            <span className="ml-2 badge bg-danger-500/10 text-danger-600 dark:text-danger-400">
              Low
            </span>
          )}
        </span>
      );
    },
  },
  {
    key: 'selling_price',
    header: 'Sell Price',
    render: (i: any) => (
      <span className="font-semibold text-surface-800 dark:text-surface-100">
        {formatCurrency(i.selling_price || 0)}
      </span>
    ),
  },
  {
    key: 'cost_price',
    header: 'Cost',
    render: (i: any) => (
      <span className="text-surface-500 dark:text-surface-400">
        {formatCurrency(i.cost_price || 0)}
      </span>
    ),
  },
  {
    key: 'reorder',
    header: 'Reorder At',
    render: (i: any) => (
      <span className="text-surface-500 dark:text-surface-400">
        {i.reorder_threshold}
      </span>
    ),
  },
  {
    key: 'act',
    header: '',
    render: (i: any) => (
      <button
        onClick={() => {
          setRestockProduct(i);
          setShowRestock(true);
          setErr('');
        }}
        className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
      >
        + Restock
      </button>
    ),
  },
];

  // ─── Stock Form (reused in Add and Restock) ──────────────────────────

  const StockForm = ({ onSubmit, productName }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; productName: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 text-sm font-semibold text-surface-700 dark:text-surface-200">{productName}</div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Quantity *</label><input name="quantity" type="number" className="input" placeholder="e.g. 100" min="1" required /></div>
        <div><label className="label">Batch Number</label><input name="batch_number" className="input" placeholder="e.g. BTH-001 (optional)" /></div>
      </div>
      <div><label className="label flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Expiry Date *</label><input name="expiry_date" type="date" className="input" required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Selling Price (&#x20A6;) *</label><input name="selling_price" type="number" step="0.01" className="input" placeholder="e.g. 500" required /></div>
        <div><label className="label">Cost Price (&#x20A6;)</label><input name="cost_price" type="number" step="0.01" className="input" placeholder="e.g. 300" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => { closeAdd(); setShowRestock(false); }} className="btn-secondary text-sm">Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary text-sm">{busy ? 'Saving...' : 'Save to Inventory'}</button>
      </div>
    </form>
  );

  // ─── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return <InventorySkeleton />;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="p-6 space-y-6"
    >
      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BlurFade delay={0.05}>
          <StatCard label="Products in Stock" value={total} icon={Package} color="brand" />
        </BlurFade>
        <BlurFade delay={0.12}>
          <StatCard label="Low Stock" value={lowStock.length} change={lowStock.length > 0 ? `${lowStock.length} need reorder` : 'All good'} icon={AlertTriangle} color="warning" />
        </BlurFade>
        <BlurFade delay={0.19}>
          <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={TrendingDown} color="info" />
        </BlurFade>
      </div>

      {/* ─── Inventory Table ─── */}
      <BlurFade delay={0.25}>
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <h3 className="font-bold text-surface-900 dark:text-surface-50">My Inventory</h3>
            <button onClick={() => { setShowAdd(true); setView('search'); }} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Product</button>
          </div>
          <DataTable columns={columns} data={inventory} emptyMessage="No products yet. Click 'Add Product' to start." />
          <Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} />
        </div>
      </BlurFade>

      {/* ─── Low Stock Alert ─── */}
      {lowStock.length > 0 && (
        <BlurFade delay={0.35}>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700">
              <h3 className="font-bold text-danger-600 dark:text-danger-400">Low Stock Alert</h3>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {lowStock.slice(0, 8).map((i: any, n: number) => (
                <div key={n} className="px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{i.product_name}</p>
                    <span className="text-xs font-bold text-danger-500 dark:text-danger-400">{i.quantity_on_hand} / {i.reorder_threshold}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-danger-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((i.quantity_on_hand / i.reorder_threshold) * 100, 100)}%` }}
                      transition={{ duration: 0.7, ease: [0, 0, 0.2, 1], delay: 0.1 * n }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BlurFade>
      )}

      {/* ═══ ADD PRODUCT MODAL ═══ */}
      <Modal open={showAdd} onClose={closeAdd} title={view === 'search' ? 'Add Product' : view === 'details' ? 'Enter Stock Details' : 'Create New Product'}>
        {/* ─── Stepper indicator ─── */}
        {view !== 'create' && (
          <div className="flex items-center gap-2 mb-5">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  idx <= activeStepIndex
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-400 dark:text-surface-500'
                )}>
                  {idx + 1}
                </div>
                <span className={cn(
                  'text-xs font-medium transition-colors',
                  idx <= activeStepIndex ? 'text-surface-800 dark:text-surface-100' : 'text-surface-400 dark:text-surface-500'
                )}>
                  {step.label}
                </span>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 rounded-full transition-colors duration-300',
                    idx < activeStepIndex ? 'bg-brand-500' : 'bg-surface-200 dark:bg-surface-700'
                  )} />
                )}
              </div>
            ))}
          </div>
        )}

        {err && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm font-medium rounded-xl border border-danger-500/20"
          >
            {err}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* SEARCH */}
          {view === 'search' && (
            <motion.div key="search" variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
              <div>
                <label className="label">Search Product Catalog</label>
                <div className="flex items-center gap-2 border border-surface-200 dark:border-surface-700 rounded-xl px-3 py-2 bg-white dark:bg-surface-800 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                  <Search className="w-4 h-4 text-surface-400" />
                  <input type="text" className="bg-transparent text-sm outline-none flex-1 text-surface-900 dark:text-surface-50 placeholder:text-surface-400" placeholder="Type product name..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} autoFocus />
                </div>
              </div>
              {catalogLoading && <p className="text-center text-sm text-surface-400 py-3">Searching...</p>}
              {catalogResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-xl divide-y divide-surface-100 dark:divide-surface-800">
                  {catalogResults.map((p: any) => (
                    <button key={p.id} onClick={() => { setSelectedProduct(p); setView('details'); setErr(''); }} className="w-full text-left px-4 py-3 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors">
                      <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{p.name}</p>
                      <p className="text-xs text-surface-400 dark:text-surface-500">{p.generic_name} · {p.strength || ''} · {p.manufacturer || ''}{p.nafdac_number ? ` · NAFDAC: ${p.nafdac_number}` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
              {catalogSearch.length >= 2 && !catalogLoading && catalogResults.length === 0 && (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-surface-400 dark:text-surface-500">No results for &quot;{catalogSearch}&quot;</p>
                  <button onClick={() => setView('create')} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Create New Product</button>
                </div>
              )}
              <div className="pt-2 border-t border-surface-200 dark:border-surface-700">
                <button onClick={() => setView('create')} className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
                  Can&apos;t find it? Create new product &rarr;
                </button>
              </div>
            </motion.div>
          )}

          {/* STOCK DETAILS (after selecting product) */}
          {view === 'details' && selectedProduct && (
            <motion.div key="details" variants={stepVariants} initial="enter" animate="center" exit="exit" className="space-y-4">
              <div className="bg-brand-50 dark:bg-brand-950/30 rounded-xl p-3 border border-brand-200/50 dark:border-brand-800/30">
                <p className="font-semibold text-surface-800 dark:text-surface-100">{selectedProduct.name}</p>
                <p className="text-xs text-surface-400 dark:text-surface-500">{selectedProduct.generic_name} · {selectedProduct.strength || ''} · {selectedProduct.manufacturer || ''}</p>
                <button onClick={() => { setView('search'); setSelectedProduct(null); }} className="text-xs text-brand-600 dark:text-brand-400 mt-1 hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Choose different</button>
              </div>
              <StockForm onSubmit={handleAddWithStock} productName={selectedProduct.name} />
            </motion.div>
          )}

          {/* CREATE NEW PRODUCT */}
          {view === 'create' && (
            <motion.div key="create" variants={stepVariants} initial="enter" animate="center" exit="exit">
              <form onSubmit={handleCreate} className="space-y-4">
                <button type="button" onClick={() => setView('search')} className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to search</button>
                <div><label className="label">Product Name *</label><input name="name" className="input" placeholder="e.g. Paracetamol 500mg, Glucometer" required minLength={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Category</label><select name="category" className="input"><option value="">Select</option><option>Analgesics</option><option>Antibiotics</option><option>Antimalaria</option><option>Cardiovascular</option><option>Diabetes</option><option>GI</option><option>Respiratory</option><option>Vitamins</option><option>Medical devices</option><option>Consumables</option><option>OTC</option><option>Other</option></select></div>
                  <div><label className="label">Dosage Form</label><select name="dosage_form" className="input"><option value="">Select</option><option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option><option>Cream</option><option>Drops</option><option>Powder</option><option>Device</option><option>N/A</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3"><div><label className="label">Generic Name</label><input name="generic_name" className="input" placeholder="e.g. Paracetamol" /></div><div><label className="label">Brand Name</label><input name="brand_name" className="input" placeholder="e.g. Emzor" /></div></div>
                <div className="grid grid-cols-2 gap-3"><div><label className="label">Strength</label><input name="strength" className="input" placeholder="e.g. 500mg" /></div><div><label className="label">Manufacturer</label><input name="manufacturer" className="input" /></div></div>
                <div className="grid grid-cols-2 gap-3"><div><label className="label">NAFDAC No.</label><input name="nafdac_number" className="input" /></div><div><label className="label">Unit</label><select name="unit_of_measure" className="input"><option value="pack">Pack</option><option value="bottle">Bottle</option><option value="strip">Strip</option><option value="piece">Piece</option></select></div></div>
                <div className="grid grid-cols-2 gap-3"><div><label className="label">Reorder Threshold</label><input name="reorder_threshold" type="number" className="input" defaultValue="10" /></div><div><label className="label">Prescription?</label><select name="requires_prescription" className="input"><option value="false">No</option><option value="true">Yes</option></select></div></div>
                <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={closeAdd} className="btn-secondary text-sm">Cancel</button><button type="submit" disabled={busy} className="btn-primary text-sm">{busy ? 'Creating...' : 'Create Product'}</button></div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* ═══ RESTOCK MODAL ═══ */}
      <Modal open={showRestock} onClose={() => { setShowRestock(false); setErr(''); }} title={`Restock - ${restockProduct?.product?.name || 'Product'}`}>
        {err && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm font-medium rounded-xl border border-danger-500/20"
          >
            {err}
          </motion.div>
        )}
        {restockProduct && <StockForm onSubmit={handleRestock} productName={restockProduct.product?.name || 'Product'} />}
      </Modal>
    </motion.div>
  );
}
