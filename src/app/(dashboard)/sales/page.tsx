'use client';

import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { NumberTicker } from '@/components/shadcn/number-ticker';
import { StatCard, LoadingSpinner, EmptyState } from '@/components/ui';
import { TrendingUp, DollarSign, ShoppingBag, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { salesApi } from '@/lib/api';
import type { Sale, SalesAnalytics } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] } },
};

const glassTooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(229,233,237,0.5)',
  borderRadius: '12px',
};

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
    return <LoadingSpinner />;
  }

  const dailyRevenue = analytics?.daily_revenue ?? [];
  const topProducts = analytics?.top_products ?? [];
  const maxRevenue = dailyRevenue.length > 0 ? Math.max(...dailyRevenue.map((d) => d.revenue)) : 1;
  const periodLabel = period <= 7 ? 'Weekly' : period <= 30 ? 'Monthly' : `${period}-Day`;

  const chartData = dailyRevenue.map((d) => ({
    date: d.date.length > 5
      ? new Date(d.date).toLocaleDateString('en-NG', { weekday: 'short' })
      : d.date,
    revenue: d.revenue,
  }));

  return (
    <motion.div
      className="p-6 space-y-6 bg-white dark:bg-surface-900 min-h-screen"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Revenue Hero Card */}
      <BlurFade delay={0.05}>
        <motion.div
          variants={staggerItem}
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{
            background: 'linear-gradient(135deg, #0d9e4a 0%, #06b656 40%, #34d399 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.3),transparent_60%)]" />
          <div className="relative z-10">
            <p className="text-sm font-medium text-white/80">{periodLabel} Revenue</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xs font-semibold text-white/70">NGN</span>
              <NumberTicker
                value={analytics?.total_revenue ?? 0}
                className="text-4xl font-bold text-white tracking-tight"
                decimalPlaces={2}
              />
            </div>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-xs text-white/60">Total Sales</p>
                <p className="text-lg font-bold">{analytics?.total_sales_count ?? '--'}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Avg. Sale Value</p>
                <p className="text-lg font-bold">{analytics ? formatCurrency(analytics.average_sale_value) : '--'}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Anomalies</p>
                <p className="text-lg font-bold">{loadingAnomalies ? '...' : anomalies.length}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </BlurFade>

      {/* Stats Cards */}
      <BlurFade delay={0.1}>
        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label={`${periodLabel} Revenue`} value={analytics ? formatCurrency(analytics.total_revenue) : '--'} icon={TrendingUp} color="brand" />
          <StatCard label="Total Sales" value={analytics ? analytics.total_sales_count : '--'} icon={ShoppingBag} color="info" />
          <StatCard label="Avg. Sale Value" value={analytics ? formatCurrency(analytics.average_sale_value) : '--'} icon={DollarSign} color="brand" />
          <StatCard label="Anomalies Detected" value={loadingAnomalies ? '...' : anomalies.length} icon={AlertCircle} color="warning" />
        </motion.div>
      </BlurFade>

      {/* Revenue Chart */}
      <BlurFade delay={0.15}>
        <motion.div variants={staggerItem} className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-surface-900 dark:text-surface-50">Revenue Trend</h3>
            <div className="flex gap-1 bg-surface-100 dark:bg-surface-700 rounded-xl p-1">
              {[{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }].map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPeriod(p.days)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
                    period === p.days
                      ? 'bg-white dark:bg-surface-600 text-surface-800 dark:text-surface-50 shadow-sm'
                      : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
          ) : errorAnalytics ? (
            <div className="flex items-center justify-center h-64 text-sm text-danger-500">{errorAnalytics}</div>
          ) : dailyRevenue.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-sm text-surface-400 dark:text-surface-500">No revenue data for this period.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9e4a" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0d9e4a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelStyle={{ fontWeight: 600 }}
                    contentStyle={glassTooltipStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0d9e4a"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={{ r: 3, fill: '#0d9e4a' }}
                    activeDot={{ r: 5, fill: '#0d9e4a', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </BlurFade>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        <BlurFade delay={0.2}>
          <motion.div variants={staggerItem} className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700">
              <h3 className="font-bold text-surface-900 dark:text-surface-50">Top Selling Products</h3>
            </div>
            {loadingAnalytics ? <LoadingSpinner /> : topProducts.length === 0 ? (
              <EmptyState message="No product sales data yet" />
            ) : (
              <motion.div
                className="divide-y divide-surface-100 dark:divide-surface-700"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {topProducts.map((product, i) => (
                  <motion.div
                    key={product.product_id}
                    variants={staggerItem}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                        i === 0
                          ? 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400'
                          : 'bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
                      )}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{product.product_name}</p>
                        <p className="text-xs text-surface-400 dark:text-surface-500">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-surface-700 dark:text-surface-200">{formatCurrency(product.revenue)}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </BlurFade>

        {/* Recent Sales */}
        <BlurFade delay={0.25}>
          <motion.div variants={staggerItem} className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-sm">
            <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700">
              <h3 className="font-bold text-surface-900 dark:text-surface-50">Recent Sales</h3>
            </div>
            {loadingSales ? <LoadingSpinner /> : errorSales ? (
              <div className="px-5 py-8 text-sm text-danger-500 text-center">{errorSales}</div>
            ) : recentSales.length === 0 ? (
              <EmptyState message="No sales recorded yet" />
            ) : (
              <motion.div
                className="divide-y divide-surface-100 dark:divide-surface-700"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {recentSales.map((sale) => (
                  <motion.div
                    key={sale.id}
                    variants={staggerItem}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">{formatCurrency(sale.total_amount)}</p>
                      <p className="text-xs text-surface-400 dark:text-surface-500">{sale.items.length} items · {formatDateTime(sale.sale_date)}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn('badge', {
                        'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400': sale.payment_method === 'cash',
                        'bg-info-500/10 text-info-600 dark:text-info-400': sale.payment_method === 'transfer',
                        'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-300': sale.payment_method === 'card',
                      })}>
                        {sale.payment_method}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </BlurFade>
      </div>
    </motion.div>
  );
}
