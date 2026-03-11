'use client';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { StatCard, DataTable, Pagination, Modal, LoadingSpinner } from '@/components/ui';
import { Package, AlertTriangle, TrendingDown, Plus, Search, Calendar, ArrowLeft } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { inventoryApi, productsApi, batchesApi } from '@/lib/api';

type ModalView = 'search' | 'details' | 'create';

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

  // ─── Table ───────────────────────────────────────────────────────────

  const columns = [
  {
    key: 'product',
    header: 'Product',
    render: (i: any) => (
      <div>
        <p className="font-semibold text-surface-800">
          {i.product?.name || 'Unknown'}
        </p>
        <p className="text-xs text-surface-400">
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
        <span className={cn('font-semibold', low ? 'text-danger-500' : 'text-surface-800')}>
          {i.quantity_on_hand}

          {i.quantity_reserved > 0 && (
            <span className="ml-1 text-xs text-warning-600">
              ({i.quantity_reserved} reserved)
            </span>
          )}

          {low && (
            <span className="ml-2 badge bg-danger-500/10 text-danger-600">
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
      <span className="font-semibold">
        {formatCurrency(i.selling_price || 0)}
      </span>
    ),
  },
  {
    key: 'cost_price',
    header: 'Cost',
    render: (i: any) => (
      <span className="text-surface-500">
        {formatCurrency(i.cost_price || 0)}
      </span>
    ),
  },
  {
    key: 'reorder',
    header: 'Reorder At',
    render: (i: any) => (
      <span className="text-surface-500">
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
        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
      >
        + Restock
      </button>
    ),
  },
];

  // ─── Stock Form (reused in Add and Restock) ──────────────────────────

  const StockForm = ({ onSubmit, productName }: { onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; productName: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-surface-50 rounded-xl p-3 text-sm font-semibold text-surface-700">{productName}</div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Quantity *</label><input name="quantity" type="number" className="input" placeholder="e.g. 100" min="1" required /></div>
        <div><label className="label">Batch Number</label><input name="batch_number" className="input" placeholder="e.g. BTH-001 (optional)" /></div>
      </div>
      <div><label className="label flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Expiry Date *</label><input name="expiry_date" type="date" className="input" required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Selling Price (₦) *</label><input name="selling_price" type="number" step="0.01" className="input" placeholder="e.g. 500" required /></div>
        <div><label className="label">Cost Price (₦)</label><input name="cost_price" type="number" step="0.01" className="input" placeholder="e.g. 300" /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => { closeAdd(); setShowRestock(false); }} className="btn-secondary text-sm">Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary text-sm">{busy ? 'Saving...' : 'Save to Inventory'}</button>
      </div>
    </form>
  );

  return (<><Header title="Inventory" /><div className="p-6 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Products in Stock" value={total} icon={Package} color="brand" />
      <StatCard label="Low Stock" value={lowStock.length} change={lowStock.length > 0 ? `${lowStock.length} need reorder` : 'All good'} icon={AlertTriangle} color="warning" />
      <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={TrendingDown} color="info" />
    </div>

    <div className="card">
      <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
        <h3 className="font-bold text-surface-900">My Inventory</h3>
        <button onClick={() => { setShowAdd(true); setView('search'); }} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add Product</button>
      </div>
      {loading ? <LoadingSpinner /> : (<><DataTable columns={columns} data={inventory} emptyMessage="No products yet. Click 'Add Product' to start." /><Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} /></>)}
    </div>

    {lowStock.length > 0 && (<div className="card"><div className="px-5 py-4 border-b border-surface-200"><h3 className="font-bold text-danger-600">Low Stock Alert</h3></div><div className="divide-y divide-surface-100">{lowStock.slice(0,8).map((i: any, n: number) => (<div key={n} className="px-5 py-3"><div className="flex justify-between mb-1"><p className="text-sm font-semibold text-surface-800">{i.product_name}</p><span className="text-xs font-bold text-danger-500">{i.quantity_on_hand} / {i.reorder_threshold}</span></div><div className="w-full h-1.5 bg-surface-100 rounded-full"><div className="h-full rounded-full bg-danger-500" style={{width:`${Math.min((i.quantity_on_hand/i.reorder_threshold)*100,100)}%`}}/></div></div>))}</div></div>)}
  </div>

  {/* ═══ ADD PRODUCT MODAL ═══ */}
  <Modal open={showAdd} onClose={closeAdd} title={view === 'search' ? 'Add Product' : view === 'details' ? 'Enter Stock Details' : 'Create New Product'}>
    {err && <div className="mb-4 p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">{err}</div>}

    {/* SEARCH */}
    {view === 'search' && (<div className="space-y-4">
      <div><label className="label">Search Product Catalog</label>
        <div className="flex items-center gap-2 border border-surface-200 rounded-xl px-3 py-2"><Search className="w-4 h-4 text-surface-400" /><input type="text" className="bg-transparent text-sm outline-none flex-1" placeholder="Type product name..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} autoFocus /></div>
      </div>
      {catalogLoading && <p className="text-center text-sm text-surface-400 py-3">Searching...</p>}
      {catalogResults.length > 0 && (<div className="max-h-60 overflow-y-auto border rounded-xl divide-y divide-surface-100">{catalogResults.map((p: any) => (
        <button key={p.id} onClick={() => { setSelectedProduct(p); setView('details'); setErr(''); }} className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors">
          <p className="text-sm font-semibold text-surface-800">{p.name}</p>
          <p className="text-xs text-surface-400">{p.generic_name} · {p.strength||''} · {p.manufacturer||''}{p.nafdac_number ? ` · NAFDAC: ${p.nafdac_number}` : ''}</p>
        </button>))}</div>)}
      {catalogSearch.length >= 2 && !catalogLoading && catalogResults.length === 0 && (<div className="text-center py-4 space-y-2"><p className="text-sm text-surface-400">No results for "{catalogSearch}"</p><button onClick={() => setView('create')} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Create New Product</button></div>)}
      <div className="pt-2 border-t border-surface-200"><button onClick={() => setView('create')} className="text-sm font-semibold text-brand-600">Can't find it? Create new product →</button></div>
    </div>)}

    {/* STOCK DETAILS (after selecting product) */}
    {view === 'details' && selectedProduct && (<div className="space-y-4">
      <div className="bg-brand-50 rounded-xl p-3">
        <p className="font-semibold text-surface-800">{selectedProduct.name}</p>
        <p className="text-xs text-surface-400">{selectedProduct.generic_name} · {selectedProduct.strength||''} · {selectedProduct.manufacturer||''}</p>
        <button onClick={() => { setView('search'); setSelectedProduct(null); }} className="text-xs text-brand-600 mt-1 hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Choose different</button>
      </div>
      <StockForm onSubmit={handleAddWithStock} productName={selectedProduct.name} />
    </div>)}

    {/* CREATE NEW PRODUCT */}
    {view === 'create' && (<form onSubmit={handleCreate} className="space-y-4">
      <button type="button" onClick={() => setView('search')} className="text-xs text-brand-600 hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to search</button>
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
    </form>)}
  </Modal>

  {/* ═══ RESTOCK MODAL ═══ */}
  <Modal open={showRestock} onClose={() => { setShowRestock(false); setErr(''); }} title={`Restock — ${restockProduct?.product?.name || 'Product'}`}>
    {err && <div className="mb-4 p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">{err}</div>}
    {restockProduct && <StockForm onSubmit={handleRestock} productName={restockProduct.product?.name || 'Product'} />}
  </Modal>
  </>);
}
