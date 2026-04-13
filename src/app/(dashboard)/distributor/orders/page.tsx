'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { DataTable, StatusBadge, Pagination, Modal, LoadingSpinner } from '@/components/ui';
import { CheckCircle, Package as PackageIcon, Truck, Clock, X } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { ordersApi } from '@/lib/api';
import type { Order, PaginatedResponse } from '@/types';

const statusFilters = ['all', 'submitted', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'];

const actionButtons: Record<string, { label: string; next: string; icon: any; color: string }[]> = {
  submitted: [
    { label: 'Confirm Order', next: 'confirmed', icon: CheckCircle, color: 'bg-info-600 hover:bg-info-700' },
    { label: 'Cancel', next: 'cancelled', icon: X, color: 'bg-danger-500 hover:bg-danger-600' },
  ],
  confirmed: [
    { label: 'Start Processing', next: 'processing', icon: PackageIcon, color: 'bg-info-600 hover:bg-info-700' },
  ],
  processing: [
    { label: 'Mark Ready', next: 'ready', icon: CheckCircle, color: 'bg-info-600 hover:bg-info-700' },
  ],
  ready: [
    { label: 'Mark Delivered', next: 'delivered', icon: Truck, color: 'bg-info-600 hover:bg-info-700' },
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
  const [statusError, setStatusError] = useState<string | null>(null);
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
    setStatusError(null);
    try {
      const updated = await ordersApi.updateStatus(orderId, newStatus);
      setSelectedOrder(updated);
      loadOrders(page, statusFilter);
      loadPendingCount();
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update order status');
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
          <p className="font-mono font-semibold text-surface-800 dark:text-surface-200">{item.order_number}</p>
          <p className="text-xs text-surface-400 dark:text-surface-500">{formatDateTime(item.created_at)}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (item: Order) => <span className="text-sm text-surface-700 dark:text-surface-300">{item.items?.length || 0} products</span>,
    },
    {
      key: 'total',
      header: 'Total',
      render: (item: Order) => <span className="font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(item.total_amount)}</span>,
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
        <button onClick={() => setSelectedOrder(item)} className="text-xs font-semibold text-info-600 dark:text-info-400 hover:text-info-700 dark:hover:text-info-300 transition-colors">
          Manage
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Pending alert */}
      {pendingCount > 0 && (
        <BlurFade delay={0.05}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl p-4 border border-warning-500/30 bg-warning-500/5 dark:bg-warning-500/10 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-warning-500/10 dark:bg-warning-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <p className="font-semibold text-surface-800 dark:text-surface-200">{pendingCount} orders awaiting confirmation</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">Review and confirm these orders to begin processing.</p>
            </div>
          </motion.div>
        </BlurFade>
      )}

      {error && (
        <div className="rounded-2xl p-4 border border-danger-500/30 bg-danger-500/5 dark:bg-danger-500/10 text-danger-700 dark:text-danger-400 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Orders table */}
      <BlurFade delay={0.1}>
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-200 dark:border-surface-700 flex gap-1 overflow-x-auto">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); loadOrders(1, s); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap',
                  statusFilter === s
                    ? 'bg-info-600 text-white'
                    : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800',
                )}
              >
                {s === 'all' ? 'All Orders' : s.replace('_', ' ')}
                {s === 'submitted' && pendingCount > 0 && (
                  <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Animated order rows */}
          {!loading && orders.length > 0 ? (
            <div>
              <DataTable columns={columns} data={orders} loading={false} />
            </div>
          ) : (
            <DataTable columns={columns} data={orders} loading={loading} />
          )}

          <Pagination page={page} pages={totalPages} total={totalItems} onPageChange={(p) => loadOrders(p, statusFilter)} />
        </div>
      </BlurFade>

      {/* Order detail modal */}
      <Modal open={!!selectedOrder} onClose={() => { setSelectedOrder(null); setStatusError(null); }} title={`Order ${selectedOrder?.order_number || ''}`}>
        {selectedOrder && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-surface-800 dark:text-surface-200">Channel: {selectedOrder.channel || 'web'}</p>
                <p className="text-sm text-surface-400 dark:text-surface-500">{formatDateTime(selectedOrder.created_at)}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div>
              <h4 className="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-2">Order Items</h4>
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl divide-y divide-surface-200 dark:divide-surface-700">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, i) => (
                    <div key={item.id || i} className="px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-surface-800 dark:text-surface-200">Product</p>
                        <p className="text-xs text-surface-400 dark:text-surface-500">Qty: {item.quantity} x {formatCurrency(item.unit_price)}</p>
                      </div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(item.line_total)}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-surface-400 dark:text-surface-500 text-center">No item details available</div>
                )}
              </div>
              <div className="flex justify-between px-4 py-3 font-bold text-surface-900 dark:text-surface-50">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {statusError && (
              <div className="bg-danger-500/5 dark:bg-danger-500/10 border border-danger-500/20 rounded-xl p-3">
                <p className="text-sm text-danger-600 dark:text-danger-400 font-semibold">{statusError}</p>
              </div>
            )}

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
              <div className="bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20 rounded-xl p-3 text-center">
                <p className="text-sm font-semibold text-info-700 dark:text-info-400">Order delivered and completed</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
