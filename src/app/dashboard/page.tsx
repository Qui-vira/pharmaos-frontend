'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { StatusBadge, LoadingSpinner } from '@/components/ui';
import { NumberTicker } from '@/components/shadcn/number-ticker';
import { MagicCard } from '@/components/shadcn/magic-card';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { Particles } from '@/components/shadcn/particles';
import {
  Package, TrendingUp, ShoppingCart, AlertTriangle,
  MessageSquare, ArrowUpRight, Clock, Activity,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { salesApi, inventoryApi, ordersApi, consultationsApi, getStoredUser } from '@/lib/api';

const kpiConfig = [
  { key: 'revenue', label: 'Monthly Revenue', icon: TrendingUp, gradient: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.25)' },
  { key: 'lowStockCount', label: 'Low Stock Items', icon: Package, gradient: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.25)' },
  { key: 'pendingOrders', label: 'Pending Orders', icon: ShoppingCart, gradient: 'from-blue-500 to-indigo-600', glow: 'rgba(59,130,246,0.25)' },
  { key: 'expiryAlerts', label: 'Expiry Alerts', icon: AlertTriangle, gradient: 'from-rose-500 to-red-600', glow: 'rgba(239,68,68,0.25)' },
] as const;

const statusBorderColor: Record<string, string> = {
  submitted: 'border-l-blue-500',
  awaiting_payment: 'border-l-amber-500',
  confirmed: 'border-l-emerald-500',
  processing: 'border-l-amber-500',
  delivered: 'border-l-emerald-600',
  cancelled: 'border-l-red-500',
  draft: 'border-l-gray-400',
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
        {/* ─── Welcome Banner with Particles ─── */}
        <BlurFade delay={0.05}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 p-8 text-white">
            <Particles
              className="absolute inset-0"
              quantity={60}
              color="#4ade83"
              size={0.6}
              staticity={30}
              ease={40}
            />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    Good {greeting}, {firstName} 👋
                  </h2>
                  <p className="text-surface-400 mt-1 text-sm">Here&apos;s what&apos;s happening with your pharmacy today.</p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-surface-400">
                  {new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </BlurFade>

        {/* ─── KPI Stats with MagicCard ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiConfig.map((kpi, index) => {
            const Icon = kpi.icon;
            const value = stats[kpi.key as keyof typeof stats];
            const isRevenue = kpi.key === 'revenue';

            return (
              <BlurFade key={kpi.key} delay={0.1 + index * 0.08}>
                <MagicCard
                  className="cursor-default border-surface-200 bg-white"
                  gradientColor={kpi.glow}
                  gradientSize={250}
                  gradientOpacity={0.15}
                >
                  <div className="p-5 w-full">
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
                      )} style={{ boxShadow: `0 8px 24px -4px ${kpi.glow}` }}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </BlurFade>
            );
          })}
        </div>

        {/* ─── Main Content Grid ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <BlurFade delay={0.35} className="xl:col-span-2">
            <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
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
                  {recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className={cn(
                        'px-5 py-3.5 flex items-center justify-between transition-all duration-200 hover:bg-surface-50 border-l-[3px]',
                        statusBorderColor[order.status] || 'border-l-surface-300',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-surface-100 rounded-lg flex items-center justify-center">
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BlurFade>

          {/* Low Stock */}
          <BlurFade delay={0.4}>
            <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
                <h3 className="font-bold text-surface-900">Low Stock Alert</h3>
                <a href="/inventory" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
              {lowStock.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Package className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                  <p className="text-sm text-surface-400">No low stock items.</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-100">
                  {lowStock.map((item: any, i: number) => {
                    const isCritical = item.quantity_on_hand <= 3;
                    const barPercent = Math.min((item.quantity_on_hand / (item.reorder_threshold || 10)) * 100, 100);

                    return (
                      <div key={i} className="px-5 py-3.5 hover:bg-surface-50 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {isCritical && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                              </span>
                            )}
                            <p className="text-sm font-semibold text-surface-800">{item.product_name}</p>
                          </div>
                          <span className={cn(
                            'text-xs font-bold px-2 py-0.5 rounded-full',
                            isCritical ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                          )}>
                            {item.quantity_on_hand} left
                          </span>
                        </div>
                        <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-700', isCritical ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-amber-500 to-amber-400')}
                            style={{ width: `${barPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </BlurFade>
        </div>

        {/* ─── Active Consultations ─── */}
        {consultations.length > 0 && (
          <BlurFade delay={0.5}>
            <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
                <h3 className="font-bold text-surface-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-600" /> Active Consultations
                </h3>
                <a href="/consultations" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="divide-y divide-surface-100">
                {consultations.map((c: any) => {
                  const initials = c.patient_name
                    ? c.patient_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'C';

                  return (
                    <div
                      key={c.id}
                      className="px-5 py-3.5 flex items-center justify-between transition-all duration-200 hover:bg-surface-50"
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
                    </div>
                  );
                })}
              </div>
            </div>
          </BlurFade>
        )}
      </div>
    </>
  );
}
