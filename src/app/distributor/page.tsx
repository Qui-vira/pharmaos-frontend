'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { StatCard, StatusBadge, LoadingSpinner } from '@/components/ui';
import { Package, ShoppingCart, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils';
import { ordersApi, catalogApi, salesApi, getStoredUser } from '@/lib/api';
import type { Order, SalesAnalytics } from '@/types';

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

  if (loading) return (<><Header title="Distributor Dashboard" /><LoadingSpinner /></>);

  if (error) {
    return (
      <><Header title="Distributor Dashboard" />
        <div className="p-6"><div className="card p-6 text-center">
          <p className="text-danger-600 font-semibold">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary text-sm mt-4" style={{ background: '#2563eb' }}>Retry</button>
        </div></div>
      </>
    );
  }

  return (
    <>
      <Header title="Distributor Dashboard" />

      <div className="p-6 space-y-6">
        <div className="card p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
          <h2 className="text-xl font-extrabold tracking-tight">
            Welcome, {user?.full_name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-blue-100 mt-1 text-sm">
            You have <strong>{pendingCount} pending orders</strong> awaiting confirmation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Catalog Products" value={catalogCount} icon={Package} color="info" />
          <StatCard label="Pending Orders" value={pendingCount} icon={ShoppingCart} color="warning" />
          <StatCard label="Monthly Revenue" value={revenue !== null ? formatCurrency(revenue) : '—'} icon={TrendingUp} color="brand" />
          <StatCard label="Total Orders" value={orders.length} icon={Clock} color="info" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 card">
            <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
              <h3 className="font-bold text-surface-900">Incoming Orders</h3>
              <a href="/distributor/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
            {orders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-surface-400">No incoming orders yet.</div>
            ) : (
              <div className="divide-y divide-surface-100">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-50 transition-colors stagger-item">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-surface-800 font-mono">{order.order_number}</p>
                        <p className="text-xs text-surface-400">{order.items?.length || 0} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-surface-700">{formatCurrency(order.total_amount)}</p>
                        <p className="text-xs text-surface-400">{formatRelativeTime(order.created_at)}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-surface-200">
              <h3 className="font-bold text-surface-900">Order Summary</h3>
            </div>
            <div className="p-5 space-y-4">
              {['submitted', 'confirmed', 'processing', 'ready', 'delivered'].map((status) => {
                const count = orders.filter((o) => o.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <span className="text-sm font-bold text-surface-700">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
