'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { StatCard, StatusBadge, LoadingSpinner } from '@/components/ui';
import { Package, ShoppingCart, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { ordersApi, catalogApi, salesApi, getStoredUser } from '@/lib/api';
import type { Order, SalesAnalytics } from '@/types';

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = value / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

export default function DistributorDashboard() {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [ordersRes, catalogRes] = await Promise.all([
          ordersApi.list(1),
          catalogApi.listMyProducts(1),
        ]);
        setOrders(ordersRes.items);
        setCatalogCount(catalogRes.total);
        setPendingCount(ordersRes.items.filter((o) => o.status === 'submitted').length);

        try {
          const analytics: SalesAnalytics = await salesApi.analytics(30);
          setRevenue(analytics.total_revenue);
        } catch { setRevenue(null); }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner />
    </div>
  );

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-6 text-center">
          <p className="text-danger-600 font-semibold">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-xl bg-info-600 hover:bg-info-700 text-white text-sm font-semibold transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner */}
      <BlurFade delay={0.05}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-6 bg-gradient-to-r from-info-600 to-info-700 text-white border border-info-500/20 shadow-lg shadow-info-500/10"
        >
          <h2 className="text-xl font-extrabold tracking-tight">
            Welcome, {user?.full_name?.split(' ')[0] || 'there'}
          </h2>
          <p className="text-blue-100 mt-1 text-sm">
            You have <strong>{pendingCount} pending orders</strong> awaiting confirmation.
          </p>
        </motion.div>
      </BlurFade>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Catalog Products', value: catalogCount, icon: Package, color: 'info' as const, delay: 0.1 },
          { label: 'Pending Orders', value: pendingCount, icon: ShoppingCart, color: 'warning' as const, delay: 0.15 },
          { label: 'Monthly Revenue', value: revenue, icon: TrendingUp, color: 'info' as const, delay: 0.2, isCurrency: true },
          { label: 'Total Orders', value: orders.length, icon: Clock, color: 'info' as const, delay: 0.25 },
        ].map((stat) => (
          <BlurFade key={stat.label} delay={stat.delay}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: stat.delay }}
              className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-surface-500 dark:text-surface-400 font-medium">{stat.label}</span>
                <div className="w-9 h-9 rounded-xl bg-info-50 dark:bg-info-500/10 flex items-center justify-center">
                  <stat.icon className="w-4.5 h-4.5 text-info-600 dark:text-info-400" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-surface-900 dark:text-surface-50">
                {stat.isCurrency
                  ? (stat.value !== null ? formatCurrency(stat.value as number) : '—')
                  : <AnimatedCounter value={stat.value as number} />
                }
              </p>
            </motion.div>
          </BlurFade>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Incoming orders */}
        <BlurFade delay={0.3}>
          <div className="xl:col-span-2 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
              <h3 className="font-bold text-surface-900 dark:text-surface-50">Incoming Orders</h3>
              <a href="/distributor/orders" className="text-sm font-semibold text-info-600 dark:text-info-400 hover:text-info-700 dark:hover:text-info-300 flex items-center gap-1 transition-colors">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            {orders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-surface-400 dark:text-surface-500">No incoming orders yet.</div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {orders.slice(0, 5).map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + i * 0.05 }}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-info-50 dark:bg-info-500/10 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-info-600 dark:text-info-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 font-mono">{order.order_number}</p>
                        <p className="text-xs text-surface-400 dark:text-surface-500">{order.items?.length || 0} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">{formatCurrency(order.total_amount)}</p>
                        <p className="text-xs text-surface-400 dark:text-surface-500">{formatRelativeTime(order.created_at)}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </BlurFade>

        {/* Order summary */}
        <BlurFade delay={0.35}>
          <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white/70 dark:bg-surface-900/70 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700">
              <h3 className="font-bold text-surface-900 dark:text-surface-50">Order Summary</h3>
            </div>
            <div className="p-5 space-y-4">
              {['submitted', 'confirmed', 'processing', 'ready', 'delivered'].map((status) => {
                const count = orders.filter((o) => o.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="text-sm font-bold text-surface-700 dark:text-surface-300">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
