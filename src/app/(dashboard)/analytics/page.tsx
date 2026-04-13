'use client';

import { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { BentoGrid, BentoCard } from '@/components/shadcn/bento-grid';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { analyticsApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Package,
  ShoppingCart, DollarSign, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart,
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

interface RevenueData {
  historical: { month: string; revenue: number }[];
  forecast: { month: string; projected_revenue: number }[];
  trend: 'growing' | 'stable' | 'declining';
  confidence: string;
}

interface DemandItem {
  product_id: string;
  product_name: string;
  avg_daily_sales: number;
  forecast_7d: number;
  forecast_14d: number;
  forecast_30d: number;
  confidence: 'high' | 'medium' | 'low';
}

interface ReorderItem {
  product_id: string;
  product_name: string;
  current_stock: number;
  avg_daily_sales: number;
  days_until_stockout: number | null;
  reorder_urgency: string;
  suggested_reorder_qty: number;
}

interface ExpiryItem {
  batch_id: string;
  product_id: string;
  product_name: string;
  batch_number: string;
  expiry_date: string;
  days_left: number;
  quantity: number;
  risk_score: number;
  suggested_action: string;
  potential_loss: number;
}

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [demand, setDemand] = useState<DemandItem[]>([]);
  const [reorders, setReorders] = useState<ReorderItem[]>([]);
  const [expiry, setExpiry] = useState<ExpiryItem[]>([]);

  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingDemand, setLoadingDemand] = useState(true);
  const [loadingReorders, setLoadingReorders] = useState(true);
  const [loadingExpiry, setLoadingExpiry] = useState(true);

  const [errorRevenue, setErrorRevenue] = useState('');
  const [errorDemand, setErrorDemand] = useState('');
  const [errorReorders, setErrorReorders] = useState('');
  const [errorExpiry, setErrorExpiry] = useState('');

  useEffect(() => {
    analyticsApi.revenueForecast(3)
      .then(setRevenue)
      .catch((e) => setErrorRevenue(e.message))
      .finally(() => setLoadingRevenue(false));

    analyticsApi.demandForecast(30)
      .then(setDemand)
      .catch((e) => setErrorDemand(e.message))
      .finally(() => setLoadingDemand(false));

    analyticsApi.reorderPredictions()
      .then(setReorders)
      .catch((e) => setErrorReorders(e.message))
      .finally(() => setLoadingReorders(false));

    analyticsApi.expiryRisk()
      .then(setExpiry)
      .catch((e) => setErrorExpiry(e.message))
      .finally(() => setLoadingExpiry(false));
  }, []);

  return (
    <motion.div
      className="p-6 space-y-6 bg-white dark:bg-surface-900 min-h-screen"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Section A -- Revenue Forecast */}
      <BlurFade delay={0.05}>
        <motion.div variants={staggerItem}>
          <RevenueSection data={revenue} loading={loadingRevenue} error={errorRevenue} />
        </motion.div>
      </BlurFade>

      {/* Two-column layout for Demand + Reorder */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Section B -- Demand Forecast */}
        <BlurFade delay={0.1}>
          <motion.div variants={staggerItem}>
            <DemandSection data={demand} loading={loadingDemand} error={errorDemand} />
          </motion.div>
        </BlurFade>

        {/* Section C -- Reorder Predictions */}
        <BlurFade delay={0.15}>
          <motion.div variants={staggerItem}>
            <ReorderSection data={reorders} loading={loadingReorders} error={errorReorders} />
          </motion.div>
        </BlurFade>
      </div>

      {/* Section D -- Expiry Risk */}
      <BlurFade delay={0.2}>
        <motion.div variants={staggerItem}>
          <ExpirySection data={expiry} loading={loadingExpiry} error={errorExpiry} />
        </motion.div>
      </BlurFade>
    </motion.div>
  );
}

// --- Section A: Revenue Forecast ---

function RevenueSection({ data, loading, error }: { data: RevenueData | null; loading: boolean; error: string }) {
  if (loading) return <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6"><LoadingSpinner /></div>;
  if (error) return <ErrorCard title="Revenue Forecast" message={error} />;

  if (!data || (data.historical.length === 0 && data.forecast.length === 0)) {
    return (
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">Revenue Forecast</h3>
        <EmptyState message="Record sales via POS to start seeing revenue predictions" icon={DollarSign} />
      </div>
    );
  }

  // Build chart data: historical + forecast combined
  const chartData = [
    ...data.historical.map((h) => ({
      month: formatMonth(h.month),
      actual: h.revenue,
      projected: null as number | null,
    })),
    ...data.forecast.map((f) => ({
      month: formatMonth(f.month),
      actual: null as number | null,
      projected: f.projected_revenue,
    })),
  ];

  // Bridge: last historical point also in projected line
  if (data.historical.length > 0 && chartData.length > data.historical.length) {
    const lastHistIdx = data.historical.length - 1;
    chartData[lastHistIdx].projected = chartData[lastHistIdx].actual;
  }

  const TrendIcon = data.trend === 'growing' ? TrendingUp : data.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = data.trend === 'growing' ? 'text-brand-600 dark:text-brand-400' : data.trend === 'declining' ? 'text-danger-500' : 'text-surface-500 dark:text-surface-400';

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Revenue Forecast</h3>
          <div className="flex items-center gap-2 mt-1">
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
            <span className={cn('text-sm font-semibold capitalize', trendColor)}>{data.trend}</span>
            <span className="text-xs text-surface-400 dark:text-surface-500">({data.confidence} confidence)</span>
          </div>
        </div>
        <div className="flex gap-4">
          {data.forecast.map((f) => (
            <div key={f.month} className="text-right">
              <p className="text-xs text-surface-400 dark:text-surface-500">{formatMonth(f.month)}</p>
              <p className="text-sm font-bold text-surface-900 dark:text-surface-50">{formatCurrency(f.projected_revenue)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="forecastGradientActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9e4a" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#0d9e4a" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="forecastGradientProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), '']}
              labelStyle={{ fontWeight: 600 }}
              contentStyle={glassTooltipStyle}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#0d9e4a"
              strokeWidth={2.5}
              fill="url(#forecastGradientActual)"
              dot={{ r: 4, fill: '#0d9e4a' }}
              name="Actual Revenue"
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="projected"
              stroke="#0d9e4a"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="url(#forecastGradientProjected)"
              dot={{ r: 4, fill: '#0d9e4a', strokeDasharray: '0' }}
              name="Projected Revenue"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Section B: Demand Forecast ---

function DemandSection({ data, loading, error }: { data: DemandItem[]; loading: boolean; error: string }) {
  if (loading) return <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6"><LoadingSpinner /></div>;
  if (error) return <ErrorCard title="Demand Forecast" message={error} />;

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">Demand Forecast</h3>
        <EmptyState message="Record sales via POS to start seeing demand predictions" icon={TrendingUp} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">Demand Forecast (30 days)</h3>

      {/* Bento grid for top 6 demand products */}
      {data.length > 0 && (
        <BentoGrid className="grid-cols-2 auto-rows-[10rem] mb-4">
          {data.slice(0, 6).map((item) => (
            <BentoCard
              key={item.product_id}
              name={item.product_name}
              className="col-span-1"
              background={
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent dark:from-brand-500/10" />
              }
              Icon={ShoppingCart}
              description={`7d: ${item.forecast_7d} | 30d: ${item.forecast_30d} units`}
              href="/inventory"
              cta="View"
            />
          ))}
        </BentoGrid>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              <th className="table-header text-left px-3 py-2.5 text-surface-600 dark:text-surface-400">Product</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">Avg/Day</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">7d</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">30d</th>
              <th className="table-header text-center px-3 py-2.5 text-surface-600 dark:text-surface-400">Confidence</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="show">
            {data.slice(0, 15).map((item) => (
              <motion.tr
                key={item.product_id}
                variants={staggerItem}
                className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              >
                <td className="px-3 py-3 text-sm font-medium text-surface-800 dark:text-surface-100 max-w-[180px] truncate">{item.product_name}</td>
                <td className="px-3 py-3 text-sm text-right text-surface-600 dark:text-surface-400">{item.avg_daily_sales}</td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-800 dark:text-surface-100">{item.forecast_7d}</td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-800 dark:text-surface-100">{item.forecast_30d}</td>
                <td className="px-3 py-3 text-center">
                  <ConfidenceBadge level={item.confidence} />
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}

// --- Section C: Reorder Predictions ---

function ReorderSection({ data, loading, error }: { data: ReorderItem[]; loading: boolean; error: string }) {
  if (loading) return <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6"><LoadingSpinner /></div>;
  if (error) return <ErrorCard title="Reorder Predictions" message={error} />;

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">Reorder Predictions</h3>
        <EmptyState message="Add inventory items to see reorder predictions" icon={Package} />
      </div>
    );
  }

  const urgentCount = data.filter((d) => d.reorder_urgency === 'reorder_urgent').length;
  const soonCount = data.filter((d) => d.reorder_urgency === 'reorder_soon').length;

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Reorder Predictions</h3>
        {(urgentCount > 0 || soonCount > 0) && (
          <div className="flex gap-2">
            {urgentCount > 0 && (
              <span className="text-xs font-bold bg-danger-500/10 text-danger-600 dark:text-danger-400 px-2 py-1 rounded-lg">
                {urgentCount} urgent
              </span>
            )}
            {soonCount > 0 && (
              <span className="text-xs font-bold bg-warning-500/10 text-warning-600 dark:text-warning-400 px-2 py-1 rounded-lg">
                {soonCount} soon
              </span>
            )}
          </div>
        )}
      </div>

      {/* Animated reorder suggestion cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {data.filter((d) => d.reorder_urgency === 'reorder_urgent' || d.reorder_urgency === 'reorder_soon').slice(0, 4).map((item) => (
          <motion.div
            key={item.product_id}
            variants={staggerItem}
            whileHover={{ scale: 1.02 }}
            className={cn(
              'rounded-xl p-3 border transition-shadow hover:shadow-md',
              item.reorder_urgency === 'reorder_urgent'
                ? 'border-danger-200 dark:border-danger-500/30 bg-danger-50 dark:bg-danger-500/10'
                : 'border-warning-200 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/10',
            )}
          >
            <p className="text-sm font-semibold text-surface-800 dark:text-surface-100 truncate">{item.product_name}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {item.days_until_stockout != null ? `${item.days_until_stockout}d left` : 'No data'}
              </span>
              <span className="text-xs font-bold text-surface-700 dark:text-surface-200">
                Order {item.suggested_reorder_qty > 0 ? item.suggested_reorder_qty : '--'}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              <th className="table-header text-left px-3 py-2.5 text-surface-600 dark:text-surface-400">Product</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">Stock</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">Days Left</th>
              <th className="table-header text-center px-3 py-2.5 text-surface-600 dark:text-surface-400">Urgency</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">Order Qty</th>
              <th className="table-header px-3 py-2.5"></th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="show">
            {data.slice(0, 15).map((item) => (
              <motion.tr
                key={item.product_id}
                variants={staggerItem}
                className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              >
                <td className="px-3 py-3 text-sm font-medium text-surface-800 dark:text-surface-100 max-w-[160px] truncate">{item.product_name}</td>
                <td className="px-3 py-3 text-sm text-right text-surface-600 dark:text-surface-400">{item.current_stock}</td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-800 dark:text-surface-100">
                  {item.days_until_stockout != null ? `${item.days_until_stockout}d` : '--'}
                </td>
                <td className="px-3 py-3 text-center">
                  <UrgencyBadge urgency={item.reorder_urgency} />
                </td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-800 dark:text-surface-100">
                  {item.suggested_reorder_qty > 0 ? item.suggested_reorder_qty : '--'}
                </td>
                <td className="px-3 py-3 text-right">
                  {(item.reorder_urgency === 'reorder_urgent' || item.reorder_urgency === 'reorder_soon') && (
                    <Link
                      href="/suppliers"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                    >
                      Order <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}

// --- Section D: Expiry Risk ---

function ExpirySection({ data, loading, error }: { data: ExpiryItem[]; loading: boolean; error: string }) {
  if (loading) return <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6"><LoadingSpinner /></div>;
  if (error) return <ErrorCard title="Expiry Risk" message={error} />;

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-4">Expiry Risk Scoring</h3>
        <EmptyState message="Add inventory batches with expiry dates to see risk scoring" icon={AlertTriangle} />
      </div>
    );
  }

  const totalLoss = data.reduce((sum, d) => sum + d.potential_loss, 0);
  const highRisk = data.filter((d) => d.risk_score > 80).length;

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Expiry Risk Scoring</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{data.length} batches at risk within 180 days</p>
        </div>
        <div className="flex gap-4 text-right">
          {highRisk > 0 && (
            <div>
              <p className="text-xs text-surface-400 dark:text-surface-500">High Risk</p>
              <p className="text-sm font-bold text-danger-600 dark:text-danger-400">{highRisk} batches</p>
            </div>
          )}
          <div>
            <p className="text-xs text-surface-400 dark:text-surface-500">Potential Loss</p>
            <p className="text-sm font-bold text-danger-600 dark:text-danger-400">{formatCurrency(totalLoss)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              <th className="table-header text-left px-3 py-2.5 text-surface-600 dark:text-surface-400">Product</th>
              <th className="table-header text-left px-3 py-2.5 text-surface-600 dark:text-surface-400">Batch</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">Expiry</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">Days Left</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">Qty</th>
              <th className="table-header text-left px-3 py-2.5 min-w-[120px] text-surface-600 dark:text-surface-400">Risk</th>
              <th className="table-header text-right px-3 py-2.5 text-surface-600 dark:text-surface-400">Loss</th>
              <th className="table-header text-center px-3 py-2.5 text-surface-600 dark:text-surface-400">Action</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="show">
            {data.slice(0, 20).map((item) => (
              <motion.tr
                key={item.batch_id}
                variants={staggerItem}
                className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors"
              >
                <td className="px-3 py-3 text-sm font-medium text-surface-800 dark:text-surface-100 max-w-[160px] truncate">{item.product_name}</td>
                <td className="px-3 py-3 text-sm text-surface-500 dark:text-surface-400 font-mono">{item.batch_number || '--'}</td>
                <td className="px-3 py-3 text-sm text-right text-surface-600 dark:text-surface-400">{formatShortDate(item.expiry_date)}</td>
                <td className={cn(
                  'px-3 py-3 text-sm text-right font-semibold',
                  item.days_left <= 7 ? 'text-danger-600 dark:text-danger-400' : item.days_left <= 30 ? 'text-warning-600 dark:text-warning-400' : 'text-surface-700 dark:text-surface-300',
                )}>
                  {item.days_left <= 0 ? 'Expired' : `${item.days_left}d`}
                </td>
                <td className="px-3 py-3 text-sm text-right text-surface-600 dark:text-surface-400">{item.quantity}</td>
                <td className="px-3 py-3">
                  <RiskBar score={item.risk_score} />
                </td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-700 dark:text-surface-200">{formatCurrency(item.potential_loss)}</td>
                <td className="px-3 py-3 text-center">
                  <ActionBadge action={item.suggested_action} />
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}

// --- Shared Components ---

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400',
    medium: 'bg-warning-500/10 text-warning-600 dark:text-warning-400',
    low: 'bg-danger-500/10 text-danger-600 dark:text-danger-400',
  };
  return (
    <span className={cn('inline-block text-xs font-bold px-2 py-0.5 rounded-md capitalize', styles[level])}>
      {level}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency === 'reorder_urgent') {
    return <span className="text-xs font-bold bg-danger-500/10 text-danger-600 dark:text-danger-400 px-2 py-0.5 rounded-md">Urgent</span>;
  }
  if (urgency === 'reorder_soon') {
    return <span className="text-xs font-bold bg-warning-500/10 text-warning-600 dark:text-warning-400 px-2 py-0.5 rounded-md">Soon</span>;
  }
  if (urgency === 'no_sales_data') {
    return <span className="text-xs font-bold bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400 px-2 py-0.5 rounded-md">No data</span>;
  }
  return <span className="text-xs font-bold bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded-md">OK</span>;
}

function RiskBar({ score }: { score: number }) {
  const color = score > 80 ? 'bg-danger-500' : score >= 50 ? 'bg-warning-500' : 'bg-brand-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-surface-600 dark:text-surface-400 w-7 text-right">{score}</span>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  if (action === 'discount_now') {
    return (
      <Link href="/inventory" className="inline-flex text-xs font-bold bg-danger-500/10 text-danger-600 dark:text-danger-400 px-2 py-0.5 rounded-md hover:bg-danger-500/20">
        Discount
      </Link>
    );
  }
  if (action === 'monitor') {
    return <span className="text-xs font-bold bg-warning-500/10 text-warning-600 dark:text-warning-400 px-2 py-0.5 rounded-md">Monitor</span>;
  }
  return <span className="text-xs font-bold bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded-md">Safe</span>;
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6">
      <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-2">{title}</h3>
      <div className="p-3 bg-danger-500/10 text-danger-600 dark:text-danger-400 text-sm font-medium rounded-xl border border-danger-500/20">
        {message}
      </div>
    </div>
  );
}

// --- Helpers ---

function formatMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${year?.slice(2)}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' });
}
