'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { StatCard, StatusBadge, LoadingSpinner } from '@/components/ui';
import {
  Package, TrendingUp, ShoppingCart, AlertTriangle,
  MessageSquare, ArrowUpRight, Clock,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { salesApi, inventoryApi, ordersApi, consultationsApi, getStoredUser } from '@/lib/api';

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

  return (
    <>
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="card p-6 bg-gradient-to-r from-brand-600 to-brand-700 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.full_name?.split(' ')[0] || 'there'} 👋
              </h2>
              <p className="text-brand-100 mt-1 text-sm">Here's what's happening with your pharmacy today.</p>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-brand-200">{new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Monthly Revenue" value={formatCurrency(stats.revenue)} change={stats.revenueChange} icon={TrendingUp} color="brand" />
          <StatCard label="Low Stock Items" value={stats.lowStockCount} icon={Package} color="warning" />
          <StatCard label="Pending Orders" value={stats.pendingOrders} icon={ShoppingCart} color="info" />
          <StatCard label="Expiry Alerts" value={stats.expiryAlerts} icon={AlertTriangle} color="danger" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="xl:col-span-2 card">
            <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
              <h3 className="font-bold text-surface-900">Recent Orders</h3>
              <a href="/orders" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-surface-400">No orders yet. Place your first order from the Supplier Catalog.</div>
            ) : (
              <div className="divide-y divide-surface-100">
                {recentOrders.map((order: any) => (
                  <div key={order.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-50 transition-colors">
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
                      <span className="text-sm font-semibold text-surface-700">{formatCurrency(order.total_amount)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
              <h3 className="font-bold text-surface-900">Low Stock Alert</h3>
              <a href="/inventory" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            {lowStock.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-surface-400">No low stock items. Add products to your inventory to track stock levels.</div>
            ) : (
              <div className="divide-y divide-surface-100">
                {lowStock.map((item: any, i: number) => (
                  <div key={i} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-surface-800">{item.product_name}</p>
                      <span className={cn('text-xs font-bold', item.quantity_on_hand <= 3 ? 'text-danger-500' : 'text-warning-600')}>
                        {item.quantity_on_hand} left
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', item.quantity_on_hand <= 3 ? 'bg-danger-500' : 'bg-warning-500')}
                        style={{ width: `${Math.min((item.quantity_on_hand / item.reorder_threshold) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Consultations */}
        {consultations.length > 0 && (
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
              <h3 className="font-bold text-surface-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600" /> Active Consultations
              </h3>
              <a href="/consultations" className="text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="divide-y divide-surface-100">
              {consultations.map((c: any) => (
                <div key={c.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-brand-700">C</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-800">Consultation</p>
                      <p className="text-xs text-surface-400">{c.symptom_summary || 'In progress...'}</p>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
