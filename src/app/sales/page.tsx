'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { StatCard, LoadingSpinner, EmptyState } from '@/components/ui';
import { TrendingUp, DollarSign, ShoppingBag, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { salesApi } from '@/lib/api';
import type { Sale, SalesAnalytics } from '@/types';

export default function SalesPage() {
  const [period, setPeriod] = useState<number>(30);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);
  const [errorAnalytics, setErrorAnalytics] = useState<string | null>(null);
  const [errorSales, setErrorSales] = useState<string | null>(null);

  useEffect(() => {
    setLoadingAnalytics(true);
    setErrorAnalytics(null);
    salesApi.analytics(period)
      .then((data) => setAnalytics(data))
      .catch((err) => setErrorAnalytics(err?.message || 'Failed to load analytics'))
      .finally(() => setLoadingAnalytics(false));
  }, [period]);

  useEffect(() => {
    setLoadingSales(true);
    setErrorSales(null);
    salesApi.list(1)
      .then((data) => setRecentSales(data.items))
      .catch((err) => setErrorSales(err?.message || 'Failed to load recent sales'))
      .finally(() => setLoadingSales(false));
  }, []);

  useEffect(() => {
    setLoadingAnomalies(true);
    salesApi.anomalies()
      .then((data) => setAnomalies(data))
      .catch(() => setAnomalies([]))
      .finally(() => setLoadingAnomalies(false));
  }, []);

  const isLoading = loadingAnalytics && loadingSales;

  if (isLoading) {
    return (<><Header title="Sales & Analytics" /><LoadingSpinner /></>);
  }

  const dailyRevenue = analytics?.daily_revenue ?? [];
  const topProducts = analytics?.top_products ?? [];
  const maxRevenue = dailyRevenue.length > 0 ? Math.max(...dailyRevenue.map((d) => d.revenue)) : 1;
  const periodLabel = period <= 7 ? 'Weekly' : period <= 30 ? 'Monthly' : `${period}-Day`;

  return (
    <>
      <Header title="Sales & Analytics" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label={`${periodLabel} Revenue`} value={analytics ? formatCurrency(analytics.total_revenue) : '--'} icon={TrendingUp} color="brand" />
          <StatCard label="Total Sales" value={analytics ? analytics.total_sales_count : '--'} icon={ShoppingBag} color="info" />
          <StatCard label="Avg. Sale Value" value={analytics ? formatCurrency(analytics.average_sale_value) : '--'} icon={DollarSign} color="brand" />
          <StatCard label="Anomalies Detected" value={loadingAnomalies ? '...' : anomalies.length} icon={AlertCircle} color="warning" />
        </div>

        {/* Revenue Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-surface-900">Revenue Trend</h3>
            <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
              {[{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }].map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPeriod(p.days)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
                    period === p.days ? 'bg-white text-surface-800 shadow-sm' : 'text-surface-500 hover:text-surface-700',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-48"><LoadingSpinner /></div>
          ) : errorAnalytics ? (
            <div className="flex items-center justify-center h-48 text-sm text-danger-500">{errorAnalytics}</div>
          ) : dailyRevenue.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-surface-400">No revenue data for this period.</div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {dailyRevenue.map((d) => {
                const height = (d.revenue / maxRevenue) * 100;
                const isMax = d.revenue === maxRevenue;
                const dateLabel = d.date.length > 5
                  ? new Date(d.date).toLocaleDateString('en-NG', { weekday: 'short' })
                  : d.date;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2 stagger-item">
                    <span className="text-xs font-semibold text-surface-500">{formatCurrency(d.revenue)}</span>
                    <div
                      className={cn('w-full rounded-t-lg transition-all duration-500', isMax ? 'bg-brand-500' : 'bg-brand-200 hover:bg-brand-300')}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs font-medium text-surface-400">{dateLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-200">
              <h3 className="font-bold text-surface-900">Top Selling Products</h3>
            </div>
            {loadingAnalytics ? <LoadingSpinner /> : topProducts.length === 0 ? (
              <EmptyState message="No product sales data yet" />
            ) : (
              <div className="divide-y divide-surface-100">
                {topProducts.map((product, i) => (
                  <div key={product.product_id} className="px-5 py-3.5 flex items-center justify-between stagger-item">
                    <div className="flex items-center gap-3">
                      <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold', i === 0 ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500')}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-surface-800">{product.product_name}</p>
                        <p className="text-xs text-surface-400">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-surface-700">{formatCurrency(product.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sales */}
          <div className="card">
            <div className="px-5 py-4 border-b border-surface-200">
              <h3 className="font-bold text-surface-900">Recent Sales</h3>
            </div>
            {loadingSales ? <LoadingSpinner /> : errorSales ? (
              <div className="px-5 py-8 text-sm text-danger-500 text-center">{errorSales}</div>
            ) : recentSales.length === 0 ? (
              <EmptyState message="No sales recorded yet" />
            ) : (
              <div className="divide-y divide-surface-100">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="px-5 py-3.5 flex items-center justify-between stagger-item">
                    <div>
                      <p className="text-sm font-semibold text-surface-800">{formatCurrency(sale.total_amount)}</p>
                      <p className="text-xs text-surface-400">{sale.items.length} items · {formatDateTime(sale.sale_date)}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn('badge', {
                        'bg-brand-100 text-brand-700': sale.payment_method === 'cash',
                        'bg-info-500/10 text-info-600': sale.payment_method === 'transfer',
                        'bg-surface-200 text-surface-600': sale.payment_method === 'card',
                      })}>
                        {sale.payment_method}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
