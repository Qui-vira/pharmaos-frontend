'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { DataTable, StatusBadge, Pagination, Modal, LoadingSpinner } from '@/components/ui';
import { ShoppingCart, Plus, Clock } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { ordersApi, catalogApi } from '@/lib/api';

// Backend statuses: draft|submitted|confirmed|processing|ready|picked_up|delivered|cancelled
const statusFilters = ['all', 'submitted', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await ordersApi.list(page, status);
      setOrders(data.items || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

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
      key: 'items',
      header: 'Items',
      render: (item: any) => <span className="text-sm">{item.items?.length || 0} products</span>,
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (item: any) => <span className="font-semibold">{formatCurrency(item.total_amount)}</span>,
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (item: any) => (
        <span className={cn('badge', {
          'bg-surface-200 text-surface-600': item.channel === 'web',
          'bg-brand-100 text-brand-700': item.channel === 'whatsapp',
          'bg-info-500/10 text-info-600': item.channel === 'voice',
          'bg-warning-500/10 text-warning-600': item.channel === 'pos',
        })}>
          {item.channel}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <>
      <Header title="Orders" />

      <div className="p-6 space-y-6">
        <div className="card">
          <div className="px-5 py-4 border-b border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex gap-1 overflow-x-auto">
              {statusFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap',
                    statusFilter === s ? 'bg-brand-600 text-white' : 'text-surface-500 hover:bg-surface-100',
                  )}
                >
                  {s === 'all' ? 'All Orders' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button onClick={() => setShowNewOrder(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> New Order
            </button>
          </div>

          {loading ? <LoadingSpinner /> : (
            <>
              <DataTable columns={columns} data={orders} emptyMessage="No orders yet." />
              <Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      <Modal open={showNewOrder} onClose={() => setShowNewOrder(false)} title="Create New Order">
        <div className="space-y-4">
          <p className="text-sm text-surface-500">
            Browse the Supplier Catalog to find products, then add them to your order.
            Orders are automatically grouped by supplier.
          </p>
          <a href="/suppliers" className="btn-primary text-sm inline-flex">
            <ShoppingCart className="w-4 h-4" /> Go to Supplier Catalog
          </a>
        </div>
      </Modal>
    </>
  );
}
