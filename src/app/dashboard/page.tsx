'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { StatusBadge, LoadingSpinner } from '@/components/ui';
import { NumberTicker } from '@/components/shadcn/number-ticker';
import {
  Package, TrendingUp, ShoppingCart, AlertTriangle,
  MessageSquare, ArrowUpRight, Clock, Activity, Sparkles,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { salesApi, inventoryApi, ordersApi, consultationsApi, getStoredUser } from '@/lib/api';

const kpiConfig = [
  { key: 'revenue', label: 'Monthly Revenue', icon: TrendingUp, color: 'brand' as const, gradient: 'from-brand-500 to-brand-600' },
  { key: 'lowStockCount', label: 'Low Stock Items', icon: Package, color: 'warning' as const, gradient: 'from-warning-500 to-orange-500' },
  { key: 'pendingOrders', label: 'Pending Orders', icon: ShoppingCart, color: 'info' as const, gradient: 'from-info-500 to-blue-500' },
  { key: 'expiryAlerts', label: 'Expiry Alerts', icon: AlertTriangle, color: 'danger' as const, gradient: 'from-danger-500 to-red-500' },
] as const;

const statusBorderColor: Record<string, string> = {
  submitted: 'border-l-info-500',
  awaiting_payment: 'border-l-warning-500',
  confirmed: 'border-l-brand-500',
  processing: 'border-l-warning-500',
  delivered: 'border-l-brand-600',
  cancelled: 'border-l-danger-500',
  draft: 'border-l-surface-400',
};

const consultStatusBorder: Record<string, string> = {
  intake: 'border-l-surface-400',
  pending_review: 'border-l-warning-500',
  pharmacist_reviewing: 'border-l-info-500',
};

export default function DashboardPage() {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    revenueChange: '',
    lowStockCount: 0,
    pendingOrders: 0,
    expiryAlerts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Load all data in parallel
        const [lowStockData, expiryData, ordersData, consultData] = await Promise.allSettled([
          inventoryApi.lowStock(),
          inventoryApi.expiryAlerts(false),
          ordersApi.list(1),
          consultationsApi.list(1),
        ]);

        const low = lowStockData.status === 'fulfilled' ? lowStockData.value : [];
        const expiry = expiryData.status === 'fulfilled' ? expiryData.value : [];
        const orders = ordersData.status === 'fulfilled' ? ordersData.value : { items: [] };
        const consult = consultData.status === 'fulfilled' ? consultData.value : { items: [] };

        // Try to load analytics
        let analytics = { total_revenue: 0, total_sales_count: 0 };
        try {
          analytics = await salesApi.analytics(30);
        } catch { /* analytics may fail if no sales yet */ }

        setStats({
          revenue: analytics.total_revenue || 0,
          revenueChange: analytics.total_sales_count > 0 ? `${analytics.total_sales_count} sales this month` : 'No sales yet',
          lowStockCount: low.length || 0,
          pendingOrders: orders.items?.filter((o: any) => ['submitted', 'awaiting_payment'].includes(o.status)).length || 0,
          expiryAlerts: expiry.length || 0,
        });

        setRecentOrders((orders.items || []).slice(0, 5));
        setLowStock((low || []).slice(0, 5));
        setConsultations((consult.items || []).filter((c: any) => ['intake', 'pending_review', 'pharmacist_reviewing'].includes(c.status)).slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <><Header title="Dashboard" /><LoadingSpinner /></>;

  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <>
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* ─── Welcome Banner ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 p-6 text-white shadow-lg shadow-brand-600/20"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Activity className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  Good {greeting}, {firstName}
                  <motion.span
                    animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                    className="inline-block origin-bottom-right"
                  >
                    <Sparkles className="w-5 h-5 text-brand-200" />
                  </motion.span>
                </h2>
                <p className="text-brand-100 mt-0.5 text-sm">Here&apos;s what&apos;s happening with your pharmacy today.</p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-brand-200">
                {new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── KPI Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiConfig.map((kpi, index) => {
            const Icon = kpi.icon;
            const value = stats[kpi.key as keyof typeof stats];
            const isRevenue = kpi.key === 'revenue';

            return (
              <motion.div
                key={kpi.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.08, ease: 'easeOut' }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className="bg-white rounded-2xl border border-surface-200 p-5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-surface-200/50 group-hover:border-surface-300">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-surface-500">{kpi.label}</p>
                      <div className="mt-2 flex items-baseline gap-1">
                        {isRevenue && (
                          <span className="text-2xl font-extrabold text-surface-900 tracking-tight">{'\u20A6'}</span>
                        )}
                        <NumberTicker
                          value={typeof value === 'number' ? value : 0}
                          delay={0.2 + index * 0.1}
                          className="text-2xl font-extrabold text-surface-900 tracking-tight"
                          decimalPlaces={isRevenue ? 2 : 0}
                        />
                      </div>
                      {isRevenue && stats.revenueChange && (
                        <p className={cn(
                          'text-xs font-semibold mt-1.5',
                          stats.revenueChange.startsWith('+') ? 'text-brand-600' : stats.revenueChange.startsWith('-') ? 'text-danger-500' : 'text-surface-400'
                        )}>
                          {stats.revenueChange}
                        </p>
                      )}
                    </div>
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg',
                      kpi.gradient,
                      kpi.color === 'brand' && 'shadow-brand-500/25',
                      kpi.color === 'warning' && 'shadow-warning-500/25',
                      kpi.color === 'info' && 'shadow-info-500/25',
                      kpi.color === 'danger' && 'shadow-danger-500/25',
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Main Content Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <motion.div
            className="xl:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
                <h3 className="font-bold text-surface-900">Recent Orders</h3>
                <a href="/orders" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
              {recentOrders.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <ShoppingCart className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                  <p className="text-sm text-surface-400">No orders yet. Place your first order from the Supplier Catalog.</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {recentOrders.map((order: any, i: number) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
                      className={cn(
                        'px-5 py-3.5 flex items-center justify-between transition-all duration-200 hover:bg-gradient-to-r hover:from-surface-50 hover:to-transparent border-l-[3px]',
                        statusBorderColor[order.status] || 'border-l-surface-300',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-surface-100 rounded-lg flex items-center justify-center group-hover:bg-surface-200 transition-colors">
                          <ShoppingCart className="w-4 h-4 text-surface-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-surface-800 font-mono">{order.order_number}</p>
                          <p className="text-xs text-surface-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatRelativeTime(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-surface-800">{formatCurrency(order.total_amount)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Low Stock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
                <h3 className="font-bold text-surface-900">Low Stock Alert</h3>
                <a href="/inventory" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
              {lowStock.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Package className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                  <p className="text-sm text-surface-400">No low stock items. Add products to your inventory to track stock levels.</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {lowStock.map((item: any, i: number) => {
                    const isCritical = item.quantity_on_hand <= 3;
                    const barPercent = Math.min((item.quantity_on_hand / (item.reorder_threshold || 10)) * 100, 100);

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.55 + i * 0.06 }}
                        className="px-5 py-3.5 hover:bg-surface-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {isCritical && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger-500" />
                              </span>
                            )}
                            <p className="text-sm font-semibold text-surface-800">{item.product_name}</p>
                          </div>
                          <span className={cn(
                            'text-xs font-bold px-2 py-0.5 rounded-full',
                            isCritical ? 'bg-danger-500/10 text-danger-600' : 'bg-warning-500/10 text-warning-600'
                          )}>
                            {item.quantity_on_hand} left
                          </span>
                        </div>
                        <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                          <motion.div
                            className={cn('h-full rounded-full', isCritical ? 'bg-gradient-to-r from-danger-500 to-danger-400' : 'bg-gradient-to-r from-warning-500 to-warning-400')}
                            initial={{ width: 0 }}
                            animate={{ width: `${barPercent}%` }}
                            transition={{ duration: 0.8, delay: 0.6 + i * 0.08, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ─── Active Consultations ───────────────────────────────────── */}
        {consultations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
                <h3 className="font-bold text-surface-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-600" /> Active Consultations
                </h3>
                <a href="/consultations" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="divide-y divide-surface-100">
                {consultations.map((c: any, i: number) => {
                  const initials = c.patient_name
                    ? c.patient_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'C';

                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.65 + i * 0.06 }}
                      whileHover={{ x: 2, transition: { duration: 0.15 } }}
                      className={cn(
                        'px-5 py-3.5 flex items-center justify-between transition-all duration-200 hover:bg-surface-50 border-l-[3px]',
                        consultStatusBorder[c.status] || 'border-l-surface-300',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-brand-700">{initials}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-surface-800">Consultation</p>
                          <p className="text-xs text-surface-400">{c.symptom_summary || 'In progress...'}</p>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
