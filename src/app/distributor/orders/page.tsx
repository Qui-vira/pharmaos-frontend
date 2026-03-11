'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { DataTable, StatusBadge, Modal } from '@/components/ui';
import { ShoppingCart, CheckCircle, Package as PackageIcon, Truck, Clock, X } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';

const mockOrders = [
  {
    id: '1', order_number: 'ORD-X3K9A2', pharmacy: 'HealthFirst Pharmacy', pharmacy_phone: '+2348012345678',
    status: 'submitted', total: 245000, created_at: new Date(Date.now() - 1800000).toISOString(),
    items: [
      { product: 'Paracetamol 500mg', qty: 50, price: 280 },
      { product: 'Amoxicillin 500mg', qty: 20, price: 850 },
      { product: 'Omeprazole 20mg', qty: 30, price: 500 },
    ],
  },
  {
    id: '2', order_number: 'ORD-Y7M2B5', pharmacy: 'GoodHealth Pharm', pharmacy_phone: '+2348098765432',
    status: 'submitted', total: 128500, created_at: new Date(Date.now() - 3600000).toISOString(),
    items: [
      { product: 'Metformin 500mg', qty: 100, price: 350 },
      { product: 'Amlodipine 5mg', qty: 50, price: 420 },
    ],
  },
  {
    id: '3', order_number: 'ORD-Z1P4C8', pharmacy: 'MediCare Plus', pharmacy_phone: '+2348055667788',
    status: 'confirmed', total: 367200, created_at: new Date(Date.now() - 7200000).toISOString(),
    items: [{ product: 'Various', qty: 12, price: 0 }],
  },
  {
    id: '4', order_number: 'ORD-W5R8D1', pharmacy: 'HealthFirst Pharmacy', pharmacy_phone: '+2348012345678',
    status: 'processing', total: 93800, created_at: new Date(Date.now() - 14400000).toISOString(),
    items: [{ product: 'Various', qty: 6, price: 0 }],
  },
  {
    id: '5', order_number: 'ORD-V2S6E9', pharmacy: 'UniPharm Lagos', pharmacy_phone: '+2347033445566',
    status: 'ready', total: 185000, created_at: new Date(Date.now() - 28800000).toISOString(),
    items: [{ product: 'Various', qty: 10, price: 0 }],
  },
  {
    id: '6', order_number: 'ORD-U8T4F3', pharmacy: 'GoodHealth Pharm', pharmacy_phone: '+2348098765432',
    status: 'delivered', total: 420000, created_at: new Date(Date.now() - 172800000).toISOString(),
    items: [{ product: 'Various', qty: 15, price: 0 }],
  },
];

const statusFilters = ['all', 'submitted', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'];

const actionButtons: Record<string, { label: string; next: string; icon: any; color: string }[]> = {
  submitted: [
    { label: 'Confirm Order', next: 'confirmed', icon: CheckCircle, color: 'bg-brand-600 hover:bg-brand-700' },
    { label: 'Cancel', next: 'cancelled', icon: X, color: 'bg-danger-500 hover:bg-danger-600' },
  ],
  confirmed: [
    { label: 'Start Processing', next: 'processing', icon: PackageIcon, color: 'bg-blue-600 hover:bg-blue-700' },
  ],
  processing: [
    { label: 'Mark Ready', next: 'ready', icon: CheckCircle, color: 'bg-brand-600 hover:bg-brand-700' },
  ],
  ready: [
    { label: 'Mark Delivered', next: 'delivered', icon: Truck, color: 'bg-brand-600 hover:bg-brand-700' },
  ],
};

export default function DistributorOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);

  const filtered = statusFilter === 'all'
    ? mockOrders
    : mockOrders.filter(o => o.status === statusFilter);

  const pendingCount = mockOrders.filter(o => o.status === 'submitted').length;

  const columns = [
    {
      key: 'order_number',
      header: 'Order',
      render: (item: any) => (
        <div>
          <p className="font-mono font-semibold text-surface-800">{item.order_number}</p>
          <p className="text-xs text-surface-400">{formatDateTime(item.created_at)}</p>
        </div>
      ),
    },
    {
      key: 'pharmacy',
      header: 'Pharmacy',
      render: (item: any) => (
        <div>
          <p className="text-sm font-medium">{item.pharmacy}</p>
          <p className="text-xs text-surface-400">{item.pharmacy_phone}</p>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (item: any) => <span className="font-semibold">{formatCurrency(item.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <button
          onClick={() => setSelectedOrder(item)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Manage
        </button>
      ),
    },
  ];

  return (
    <>
      <Header title="Incoming Orders" />

      <div className="p-6 space-y-6">
        {/* Alert for pending orders */}
        {pendingCount > 0 && (
          <div className="card p-4 border-warning-500/30 bg-warning-500/5 flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="font-semibold text-surface-800">{pendingCount} orders awaiting confirmation</p>
              <p className="text-sm text-surface-500">Review and confirm these orders to begin processing.</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card">
          <div className="px-5 py-3 border-b border-surface-200 flex gap-1 overflow-x-auto">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap',
                  statusFilter === s ? 'bg-blue-600 text-white' : 'text-surface-500 hover:bg-surface-100',
                )}
              >
                {s === 'all' ? 'All Orders' : s.replace('_', ' ')}
                {s === 'submitted' && pendingCount > 0 && (
                  <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          <DataTable columns={columns} data={filtered} />
        </div>
      </div>

      {/* Order Detail / Action Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.order_number || ''}`}
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Order Info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-surface-800">{selectedOrder.pharmacy}</p>
                <p className="text-sm text-surface-400">{selectedOrder.pharmacy_phone}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-semibold text-surface-600 mb-2">Order Items</h4>
              <div className="bg-surface-50 rounded-xl divide-y divide-surface-200">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{item.product}</p>
                      <p className="text-xs text-surface-400">Qty: {item.qty}</p>
                    </div>
                    {item.price > 0 && (
                      <p className="text-sm font-semibold">{formatCurrency(item.qty * item.price)}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-4 py-3 font-bold text-surface-900">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Pickup Time (for confirmed+ orders) */}
            {['confirmed', 'processing', 'ready'].includes(selectedOrder.status) && (
              <div>
                <label className="label">Pickup / Delivery Time</label>
                <input type="datetime-local" className="input" />
              </div>
            )}

            {/* Action Buttons */}
            {actionButtons[selectedOrder.status] && (
              <div className="flex gap-3 pt-2">
                {actionButtons[selectedOrder.status].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.next}
                      onClick={() => setSelectedOrder(null)}
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white font-semibold rounded-xl transition-all text-sm',
                        action.color,
                      )}
                    >
                      <Icon className="w-4 h-4" /> {action.label}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedOrder.status === 'delivered' && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 text-center">
                <p className="text-sm font-semibold text-brand-700">✓ Order delivered and completed</p>
                <p className="text-xs text-brand-600 mt-1">Inventory was auto-adjusted for both parties.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
