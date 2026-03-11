'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { DataTable, StatusBadge, Pagination, Modal } from '@/components/ui';
import { Package, Plus, Search, Edit, Eye, EyeOff } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

const mockCatalog = [
  { id: '1', product_name: 'Paracetamol 500mg', generic: 'Paracetamol', strength: '500mg', manufacturer: 'Emzor', unit_price: 280, quantity_available: 5000, is_published: true },
  { id: '2', product_name: 'Amoxicillin 500mg', generic: 'Amoxicillin', strength: '500mg', manufacturer: 'Fidson', unit_price: 850, quantity_available: 2000, is_published: true },
  { id: '3', product_name: 'Metformin 500mg', generic: 'Metformin', strength: '500mg', manufacturer: 'Neimeth', unit_price: 350, quantity_available: 4000, is_published: true },
  { id: '4', product_name: 'Ciprofloxacin 500mg', generic: 'Ciprofloxacin', strength: '500mg', manufacturer: 'Vitabiotics', unit_price: 1200, quantity_available: 800, is_published: false },
  { id: '5', product_name: 'Omeprazole 20mg', generic: 'Omeprazole', strength: '20mg', manufacturer: 'Emzor', unit_price: 500, quantity_available: 3200, is_published: true },
  { id: '6', product_name: 'Amlodipine 5mg', generic: 'Amlodipine', strength: '5mg', manufacturer: 'Pfizer', unit_price: 420, quantity_available: 1800, is_published: true },
  { id: '7', product_name: 'Losartan 50mg', generic: 'Losartan', strength: '50mg', manufacturer: 'Micro Labs', unit_price: 380, quantity_available: 2500, is_published: true },
  { id: '8', product_name: 'Diclofenac 50mg', generic: 'Diclofenac', strength: '50mg', manufacturer: 'Swiss Pharma', unit_price: 220, quantity_available: 6000, is_published: true },
];

export default function DistributorCatalogPage() {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = mockCatalog.filter(
    (p) => p.product_name.toLowerCase().includes(search.toLowerCase()) ||
           p.generic.toLowerCase().includes(search.toLowerCase())
  );

  const publishedCount = mockCatalog.filter(p => p.is_published).length;
  const totalStock = mockCatalog.reduce((sum, p) => sum + p.quantity_available, 0);

  const columns = [
    {
      key: 'product_name',
      header: 'Product',
      render: (item: any) => (
        <div>
          <p className="font-semibold text-surface-800">{item.product_name}</p>
          <p className="text-xs text-surface-400">{item.manufacturer} · {item.strength}</p>
        </div>
      ),
    },
    {
      key: 'unit_price',
      header: 'Unit Price',
      render: (item: any) => <span className="font-semibold">{formatCurrency(item.unit_price)}</span>,
    },
    {
      key: 'quantity_available',
      header: 'Stock',
      render: (item: any) => (
        <span className={cn('font-semibold', item.quantity_available < 1000 ? 'text-warning-600' : 'text-surface-800')}>
          {item.quantity_available.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'is_published',
      header: 'Visibility',
      render: (item: any) => item.is_published ? (
        <span className="badge bg-brand-100 text-brand-700 flex items-center gap-1 w-fit">
          <Eye className="w-3 h-3" /> Published
        </span>
      ) : (
        <span className="badge bg-surface-200 text-surface-500 flex items-center gap-1 w-fit">
          <EyeOff className="w-3 h-3" /> Hidden
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditingId(item.id)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Edit className="w-3 h-3" /> Edit
          </button>
        </div>
      ),
    },
  ];

  const editingItem = editingId ? mockCatalog.find(p => p.id === editingId) : null;

  return (
    <>
      <Header title="My Product Catalog" />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-sm text-surface-500">Total Products</p>
            <p className="text-2xl font-extrabold text-surface-900 mt-1">{mockCatalog.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-surface-500">Published</p>
            <p className="text-2xl font-extrabold text-brand-600 mt-1">{publishedCount}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-surface-500">Total Stock Units</p>
            <p className="text-2xl font-extrabold text-surface-900 mt-1">{totalStock.toLocaleString()}</p>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="card">
          <div className="px-5 py-4 border-b border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1 sm:w-72">
              <Search className="w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search your catalog..."
                className="bg-transparent text-sm outline-none flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm" style={{ background: '#2563eb' }}>
              <Plus className="w-4 h-4" /> Add Product to Catalog
            </button>
          </div>

          <DataTable columns={columns} data={filtered} />
          <Pagination page={1} pages={1} total={filtered.length} onPageChange={() => {}} />
        </div>
      </div>

      {/* Add to Catalog Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Product to Your Catalog">
        <div className="space-y-4">
          <div>
            <label className="label">Search Global Product Catalog</label>
            <input className="input" placeholder="Search by name, e.g. Paracetamol 500mg..." />
            <p className="text-xs text-surface-400 mt-1">Select from the platform's global product catalog. Products are shared across all organizations.</p>
          </div>
          <div className="bg-surface-50 border border-surface-200 rounded-xl p-3 min-h-[80px] flex items-center justify-center">
            <p className="text-sm text-surface-400">Search and select a product above</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Your Unit Price (₦)</label>
              <input type="number" className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="label">Available Stock</label>
              <input type="number" className="input" placeholder="0" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="published" defaultChecked className="rounded" />
            <label htmlFor="published" className="text-sm text-surface-600">Publish to pharmacies immediately</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button className="btn-primary text-sm" style={{ background: '#2563eb' }}>Add to My Catalog</button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Update Product">
        {editingItem && (
          <div className="space-y-4">
            <div className="bg-surface-50 rounded-xl p-3">
              <p className="font-semibold text-surface-800">{editingItem.product_name}</p>
              <p className="text-xs text-surface-400">{editingItem.manufacturer} · {editingItem.strength}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Unit Price (₦)</label>
                <input type="number" className="input" defaultValue={editingItem.unit_price} />
              </div>
              <div>
                <label className="label">Available Stock</label>
                <input type="number" className="input" defaultValue={editingItem.quantity_available} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-published" defaultChecked={editingItem.is_published} className="rounded" />
              <label htmlFor="edit-published" className="text-sm text-surface-600">Published to pharmacies</label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditingId(null)} className="btn-secondary text-sm">Cancel</button>
              <button className="btn-primary text-sm" style={{ background: '#2563eb' }}>Save Changes</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
