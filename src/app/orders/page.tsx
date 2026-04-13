'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import { DataTable, StatusBadge, Pagination, Modal, LoadingSpinner } from '@/components/ui';
import {
  ShoppingCart,
  Plus,
  Clock,
  Globe,
  MessageCircle,
  Phone,
  Monitor,
  Package,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { ordersApi, catalogApi } from '@/lib/api';

// Backend statuses: draft|submitted|confirmed|processing|ready|picked_up|delivered|cancelled
const statusFilters = ['all', 'submitted', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'];

const channelConfig: Record<string, { icon: typeof Globe; label: string; colors: string }> = {
  web: { icon: Globe, label: 'Web', colors: 'bg-surface-100 text-surface-600 border-surface-200' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', colors: 'bg-brand-50 text-brand-700 border-brand-200' },
  voice: { icon: Phone, label: 'Voice', colors: 'bg-info-500/10 text-info-600 border-info-200' },
  pos: { icon: Monitor, label: 'POS', colors: 'bg-warning-500/10 text-warning-600 border-warning-200' },
};

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
          <p className="font-mono font-bold text-surface-900 text-sm tracking-tight">
            {item.order_number}
          </p>
          <p className="text-xs text-surface-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(item.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center">
            <Package className="w-3.5 h-3.5 text-surface-500" />
          </div>
          <span className="text-sm font-medium text-surface-700">
            {item.items?.length || 0} products
          </span>
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (item: any) => (
        <span className="text-sm font-bold text-surface-900 tabular-nums">
          {formatCurrency(item.total_amount)}
        </span>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (item: any) => {
        const config = channelConfig[item.channel] || channelConfig.web;
        const Icon = config.icon;
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
              config.colors,
            )}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        );
      },
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
        {/* Main Card */}
        <motion.div
          className="card overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Toolbar */}
          <div className="px-5 py-4 border-b border-surface-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto relative p-1 bg-surface-50 rounded-xl">
              {statusFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={cn(
                    'relative px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors whitespace-nowrap z-10',
                    statusFilter === s
                      ? 'text-white'
                      : 'text-surface-500 hover:text-surface-700',
                  )}
                >
                  {/* Animated background indicator */}
                  {statusFilter === s && (
                    <motion.div
                      layoutId="activeStatusTab"
                      className="absolute inset-0 bg-brand-600 rounded-xl shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {s === 'all' ? 'All Orders' : s.replace('_', ' ')}
                    {s === 'all' && total > 0 && (
                      <span
                        className={cn(
                          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-bold',
                          statusFilter === s
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-200 text-surface-500',
                        )}
                      >
                        {total}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* New Order Button */}
            <motion.button
              onClick={() => setShowNewOrder(true)}
              className="btn-primary text-sm inline-flex items-center gap-2 shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" /> New Order
            </motion.button>
          </div>

          {/* Table Content */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingSpinner />
            </motion.div>
          ) : orders.length === 0 ? (
            /* Enhanced Empty State */
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-brand-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shadow-sm border border-surface-200">
                  <Package className="w-4 h-4 text-surface-400" />
                </div>
              </div>
              <p className="text-base font-semibold text-surface-700 mb-1">No orders yet</p>
              <p className="text-sm text-surface-400 mb-6 max-w-xs text-center">
                Start by browsing the supplier catalog to find products and place your first order.
              </p>
              <a
                href="/suppliers"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
              >
                Browse Suppliers
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <DataTable columns={columns} data={orders} emptyMessage="No orders yet." />
              <Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* New Order Modal */}
      <Modal open={showNewOrder} onClose={() => setShowNewOrder(false)} title="Create New Order">
        <div className="space-y-6">
          {/* Illustration */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
              <ShoppingCart className="w-9 h-9 text-brand-500" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-base font-semibold text-surface-800">
              Ready to place an order?
            </p>
            <p className="text-sm text-surface-500 leading-relaxed max-w-sm mx-auto">
              Browse the Supplier Catalog to find products, then add them to your order.
              Orders are automatically grouped by supplier.
            </p>
          </div>

          <div className="flex justify-center">
            <a
              href="/suppliers"
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-sm hover:shadow-md"
            >
              <ShoppingCart className="w-4 h-4" />
              Go to Supplier Catalog
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
