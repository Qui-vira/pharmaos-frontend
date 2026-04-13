'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
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
  CheckCircle2,
  Circle,
  Truck,
  ClipboardCheck,
  BoxSelect,
} from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { ordersApi, catalogApi } from '@/lib/api';

// Backend statuses: draft|submitted|confirmed|processing|ready|picked_up|delivered|cancelled
const statusFilters = ['all', 'submitted', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'];

const statusColorMap: Record<string, string> = {
  submitted: 'border-l-blue-400',
  confirmed: 'border-l-indigo-400',
  processing: 'border-l-amber-400',
  ready: 'border-l-emerald-400',
  picked_up: 'border-l-purple-400',
  delivered: 'border-l-green-500',
  cancelled: 'border-l-red-400',
  draft: 'border-l-surface-300',
};

const statusTimeline = [
  { key: 'submitted', label: 'Submitted', icon: ClipboardCheck },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: BoxSelect },
  { key: 'ready', label: 'Ready', icon: Package },
  { key: 'delivered', label: 'Delivered', icon: Truck },
];

const channelConfig: Record<string, { icon: typeof Globe; label: string; colors: string }> = {
  web: { icon: Globe, label: 'Web', colors: 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-600' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', colors: 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-700' },
  voice: { icon: Phone, label: 'Voice', colors: 'bg-info-500/10 dark:bg-info-500/20 text-info-600 dark:text-info-400 border-info-200 dark:border-info-700' },
  pos: { icon: Monitor, label: 'POS', colors: 'bg-warning-500/10 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400 border-warning-200 dark:border-warning-700' },
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
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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

  // Get the current step index for the timeline stepper
  const getStatusStep = (status: string) => {
    const idx = statusTimeline.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : -1;
  };

  const columns = [
    {
      key: 'order_number',
      header: 'Order',
      render: (item: any) => (
        <div>
          <p className="font-mono font-bold text-surface-900 dark:text-surface-50 text-sm tracking-tight">
            {item.order_number}
          </p>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5 flex items-center gap-1">
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
          <div className="w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
            <Package className="w-3.5 h-3.5 text-surface-500 dark:text-surface-400" />
          </div>
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {item.items?.length || 0} products
          </span>
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total',
      render: (item: any) => (
        <span className="text-sm font-bold text-surface-900 dark:text-surface-50 tabular-nums">
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
    {
      key: 'detail',
      header: '',
      render: (item: any) => (
        <button
          onClick={() => setSelectedOrder(item)}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="p-6 space-y-6 bg-white dark:bg-surface-900 min-h-screen">
        {/* Page Title */}
        <BlurFade delay={0.05}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Orders</h1>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                Manage and track all pharmacy orders
              </p>
            </div>
            <motion.button
              onClick={() => setShowNewOrder(true)}
              className="btn-primary text-sm inline-flex items-center gap-2 shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" /> New Order
            </motion.button>
          </div>
        </BlurFade>

        {/* Main Card */}
        <BlurFade delay={0.1}>
          <motion.div
            className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Toolbar - Animated Pill Filter Buttons */}
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700">
              <div className="flex gap-1 overflow-x-auto relative p-1 bg-surface-50 dark:bg-surface-900 rounded-xl">
                {statusFilters.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={cn(
                      'relative px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors whitespace-nowrap z-10',
                      statusFilter === s
                        ? 'text-white'
                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200',
                    )}
                  >
                    {/* Animated background indicator */}
                    {statusFilter === s && (
                      <motion.div
                        layoutId="activeStatusTab"
                        className="absolute inset-0 bg-brand-600 dark:bg-brand-500 rounded-xl shadow-sm"
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
                              : 'bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400',
                          )}
                        >
                          {total}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
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
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-brand-400 dark:text-brand-300" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center shadow-sm border border-surface-200 dark:border-surface-600">
                    <Package className="w-4 h-4 text-surface-400 dark:text-surface-500" />
                  </div>
                </div>
                <p className="text-base font-semibold text-surface-700 dark:text-surface-200 mb-1">No orders yet</p>
                <p className="text-sm text-surface-400 dark:text-surface-500 mb-6 max-w-xs text-center">
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
                {/* Glass Order Cards (mobile-friendly) + Table (desktop) */}
                <div className="hidden md:block">
                  <DataTable columns={columns} data={orders} emptyMessage="No orders yet." />
                </div>

                {/* Mobile: Glass order cards with status-colored borders */}
                <div className="md:hidden divide-y divide-surface-100 dark:divide-surface-700">
                  <AnimatePresence mode="popLayout">
                    {orders.map((order, i) => (
                      <motion.div
                        key={order.id || order.order_number}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                        onClick={() => setSelectedOrder(order)}
                        className={cn(
                          'px-5 py-4 cursor-pointer border-l-4 backdrop-blur-sm',
                          'bg-white/80 dark:bg-surface-800/80 hover:bg-surface-50 dark:hover:bg-surface-700/80 transition-colors',
                          statusColorMap[order.status] || 'border-l-surface-300',
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-sm text-surface-900 dark:text-surface-50">
                            {order.order_number}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" /> {order.items?.length || 0} items
                          </span>
                          <span className="font-bold text-surface-900 dark:text-surface-100 text-sm tabular-nums">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Pagination page={page} pages={totalPages} total={total} onPageChange={setPage} />
              </motion.div>
            )}
          </motion.div>
        </BlurFade>
      </div>

      {/* Order Detail Slide-in Panel */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
            />
            {/* Slide-in Panel */}
            <motion.div
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-surface-800 border-l border-surface-200 dark:border-surface-700 shadow-2xl z-50 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                      {selectedOrder.order_number}
                    </h2>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                      {formatDateTime(selectedOrder.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 text-xl font-bold transition-colors"
                  >
                    &times;
                  </button>
                </div>

                {/* Status + Channel */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedOrder.status} />
                  {(() => {
                    const config = channelConfig[selectedOrder.channel] || channelConfig.web;
                    const Icon = config.icon;
                    return (
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', config.colors)}>
                        <Icon className="w-3 h-3" /> {config.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Status Timeline Stepper */}
                {selectedOrder.status !== 'cancelled' && (
                  <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4">
                    <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4">
                      Order Progress
                    </p>
                    <div className="relative flex items-center justify-between">
                      {/* Connecting line */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-surface-200 dark:bg-surface-700 z-0" />
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-500 z-0"
                        initial={{ width: '0%' }}
                        animate={{
                          width: `${Math.max(0, (getStatusStep(selectedOrder.status) / (statusTimeline.length - 1)) * 100)}%`,
                        }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                      {statusTimeline.map((step, i) => {
                        const currentStep = getStatusStep(selectedOrder.status);
                        const isCompleted = i <= currentStep;
                        const isCurrent = i === currentStep;
                        const StepIcon = step.icon;
                        return (
                          <motion.div
                            key={step.key}
                            className="relative z-10 flex flex-col items-center"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.3 }}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                                isCompleted
                                  ? 'bg-brand-500 text-white'
                                  : 'bg-surface-200 dark:bg-surface-700 text-surface-400 dark:text-surface-500',
                                isCurrent && 'ring-4 ring-brand-500/20',
                              )}
                            >
                              <StepIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className={cn(
                              'text-[10px] mt-1.5 font-medium whitespace-nowrap',
                              isCompleted
                                ? 'text-brand-600 dark:text-brand-400'
                                : 'text-surface-400 dark:text-surface-500',
                            )}>
                              {step.label}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between bg-surface-50 dark:bg-surface-900 rounded-xl px-4 py-3">
                  <span className="text-sm text-surface-500 dark:text-surface-400">Total Amount</span>
                  <span className="text-lg font-bold text-surface-900 dark:text-surface-50 tabular-nums">
                    {formatCurrency(selectedOrder.total_amount)}
                  </span>
                </div>

                {/* Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">
                      Order Items
                    </p>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + i * 0.05 }}
                          className="flex items-center justify-between bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                              {item.product_name || item.name || 'Product'}
                            </p>
                            <p className="text-xs text-surface-400 dark:text-surface-500">
                              Qty: {item.quantity || 0}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-surface-900 dark:text-surface-50 tabular-nums">
                            {formatCurrency(item.total || item.unit_price * (item.quantity || 1))}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Order Modal */}
      <Modal open={showNewOrder} onClose={() => setShowNewOrder(false)} title="Create New Order">
        <div className="space-y-6">
          {/* Illustration */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center">
              <ShoppingCart className="w-9 h-9 text-brand-500 dark:text-brand-400" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-base font-semibold text-surface-800 dark:text-surface-200">
              Ready to place an order?
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed max-w-sm mx-auto">
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
