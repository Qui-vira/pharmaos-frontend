'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { DataTable, StatusBadge, Pagination, Modal, LoadingSpinner } from '@/components/ui';
import { CheckCircle, Package as PackageIcon, Truck, Clock, X } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { ordersApi } from '@/lib/api';
import type { Order, PaginatedResponse } from '@/types';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const loadOrders = useCallback(async (p: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = status === 'all' ? undefined : status;
      const res: PaginatedResponse<Order> = await ordersApi.list(p, statusParam);
      setOrders(res.items);
      setPage(res.page);
      setTotalPages(res.pages);
      setTotalItems(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingCount = useCallback(async () => {
    try {
      const res = await ordersApi.list(1, 'submitted');
      setPendingCount(res.total);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadOrders(1, statusFilter);
    loadPendingCount();
  }, [loadOrders, loadPendingCount, statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(newStatus);
    try {
      const updated = await ordersApi.updateStatus(orderId, newStatus);
      setSelectedOrder(updated);
      loadOrders(page, statusFilter);
      loadPendingCount();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const columns = [
    {
      key: 'order_number',
      header: 'Order',
      render: (item: Order) => (
        <div>
          <p className="font-mono font-semibold text-surface-800">{item.order_number}</p>
          <p className="text-xs text-surface-400">{formatDateTime(item.created_at)}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (item: Order) => <span className="text-sm">{item.items?.length || 0} products</span>,
    },
    {
      key: 'total',
      header: 'Total',
      render: (item: Order) => <span className="font-semibold">{formatCurrency(item.total_amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Order) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (item: Order) => (
        <button onClick={() => setSelectedOrder(item)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          Manage
        </button>
      ),
    },
  ];

  return (
    <>
      <Header title="Incoming Orders" />

      <div className="p-6 space-y-6">
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

        {error && <div className="card p-4 border-danger-500/30 bg-danger-500/5 text-danger-700 text-sm font-semibold">{error}</div>}

        <div className="card">
          <div className="px-5 py-3 border-b border-surface-200 flex gap-1 overflow-x-auto">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); loadOrders(1, s); }}
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
          <DataTable columns={columns} data={orders} loading={loading} />
          <Pagination page={page} pages={totalPages} total={totalItems} onPageChange={(p) => loadOrders(p, statusFilter)} />
        </div>
      </div>

      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder?.order_number || ''}`}>
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-surface-800">Channel: {selectedOrder.channel || 'web'}</p>
                <p className="text-sm text-surface-400">{formatDateTime(selectedOrder.created_at)}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-surface-600 mb-2">Order Items</h4>
              <div className="bg-surface-50 rounded-xl divide-y divide-surface-200">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, i) => (
                    <div key={item.id || i} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-surface-800">Product</p>
                        <p className="text-xs text-surface-400">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(item.line_total)}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-surface-400 text-center">No item details available</div>
                )}
              </div>
              <div className="flex justify-between px-4 py-3 font-bold text-surface-900">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {actionButtons[selectedOrder.status] && (
              <div className="flex gap-3 pt-2">
                {actionButtons[selectedOrder.status].map((action) => {
                  const Icon = action.icon;
                  const isUpdating = updatingStatus === action.next;
                  return (
                    <button
                      key={action.next}
                      onClick={() => handleStatusUpdate(selectedOrder.id, action.next)}
                      disabled={!!updatingStatus}
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50',
                        action.color,
                      )}
                    >
                      {isUpdating ? 'Updating...' : (<><Icon className="w-4 h-4" /> {action.label}</>)}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedOrder.status === 'delivered' && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 text-center">
                <p className="text-sm font-semibold text-brand-700">Order delivered and completed</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
