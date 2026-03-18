'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
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
  ResponsiveContainer, Legend,
} from 'recharts';

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
    <>
      <Header title="Predictive Analytics" />
      <div className="p-6 space-y-6">
        {/* Section A — Revenue Forecast */}
        <RevenueSection data={revenue} loading={loadingRevenue} error={errorRevenue} />

        {/* Two-column layout for Demand + Reorder */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Section B — Demand Forecast */}
          <DemandSection data={demand} loading={loadingDemand} error={errorDemand} />

          {/* Section C — Reorder Predictions */}
          <ReorderSection data={reorders} loading={loadingReorders} error={errorReorders} />
        </div>

        {/* Section D — Expiry Risk */}
        <ExpirySection data={expiry} loading={loadingExpiry} error={errorExpiry} />
      </div>
    </>
  );
}

// ─── Section A: Revenue Forecast ────────────────────────────────────────────

function RevenueSection({ data, loading, error }: { data: RevenueData | null; loading: boolean; error: string }) {
  if (loading) return <div className="card p-6"><LoadingSpinner /></div>;
  if (error) return <ErrorCard title="Revenue Forecast" message={error} />;

  if (!data || (data.historical.length === 0 && data.forecast.length === 0)) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Revenue Forecast</h3>
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
    // Bridge point: last actual month also gets projected value for continuity
    ...data.forecast.map((f) => ({
      month: formatMonth(f.month),
      actual: null as number | null,
      projected: f.projected_revenue,
    })),
  ];

  // Add bridge: last historical point also in projected line
  if (data.historical.length > 0 && chartData.length > data.historical.length) {
    const lastHistIdx = data.historical.length - 1;
    chartData[lastHistIdx].projected = chartData[lastHistIdx].actual;
  }

  const TrendIcon = data.trend === 'growing' ? TrendingUp : data.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = data.trend === 'growing' ? 'text-brand-600' : data.trend === 'declining' ? 'text-danger-500' : 'text-surface-500';

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-surface-900">Revenue Forecast</h3>
          <div className="flex items-center gap-2 mt-1">
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
            <span className={cn('text-sm font-semibold capitalize', trendColor)}>{data.trend}</span>
            <span className="text-xs text-surface-400">({data.confidence} confidence)</span>
          </div>
        </div>
        <div className="flex gap-4">
          {data.forecast.map((f, i) => (
            <div key={f.month} className="text-right">
              <p className="text-xs text-surface-400">{formatMonth(f.month)}</p>
              <p className="text-sm font-bold text-surface-900">{formatCurrency(f.projected_revenue)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), '']}
              labelStyle={{ fontWeight: 600 }}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#0d9e4a"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#0d9e4a' }}
              name="Actual Revenue"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="projected"
              stroke="#0d9e4a"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 4, fill: '#0d9e4a', strokeDasharray: '0' }}
              name="Projected Revenue"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Section B: Demand Forecast ─────────────────────────────────────────────

function DemandSection({ data, loading, error }: { data: DemandItem[]; loading: boolean; error: string }) {
  if (loading) return <div className="card p-6"><LoadingSpinner /></div>;
  if (error) return <ErrorCard title="Demand Forecast" message={error} />;

  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Demand Forecast</h3>
        <EmptyState message="Record sales via POS to start seeing demand predictions" icon={TrendingUp} />
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-surface-900 mb-4">Demand Forecast (30 days)</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="table-header text-left px-3 py-2.5">Product</th>
              <th className="table-header text-right px-3 py-2.5">Avg/Day</th>
              <th className="table-header text-right px-3 py-2.5">7d</th>
              <th className="table-header text-right px-3 py-2.5">30d</th>
              <th className="table-header text-center px-3 py-2.5">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 15).map((item) => (
              <tr key={item.product_id} className="border-b border-surface-100">
                <td className="px-3 py-3 text-sm font-medium text-surface-800 max-w-[180px] truncate">{item.product_name}</td>
                <td className="px-3 py-3 text-sm text-right text-surface-600">{item.avg_daily_sales}</td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-800">{item.forecast_7d}</td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-800">{item.forecast_30d}</td>
                <td className="px-3 py-3 text-center">
                  <ConfidenceBadge level={item.confidence} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Section C: Reorder Predictions ─────────────────────────────────────────

function ReorderSection({ data, loading, error }: { data: ReorderItem[]; loading: boolean; error: string }) {
  if (loading) return <div className="card p-6"><LoadingSpinner /></div>;
  if (error) return <ErrorCard title="Reorder Predictions" message={error} />;

  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Reorder Predictions</h3>
        <EmptyState message="Add inventory items to see reorder predictions" icon={Package} />
      </div>
    );
  }

  const urgentCount = data.filter((d) => d.reorder_urgency === 'reorder_urgent').length;
  const soonCount = data.filter((d) => d.reorder_urgency === 'reorder_soon').length;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-surface-900">Reorder Predictions</h3>
        {(urgentCount > 0 || soonCount > 0) && (
          <div className="flex gap-2">
            {urgentCount > 0 && (
              <span className="text-xs font-bold bg-danger-500/10 text-danger-600 px-2 py-1 rounded-lg">
                {urgentCount} urgent
              </span>
            )}
            {soonCount > 0 && (
              <span className="text-xs font-bold bg-warning-500/10 text-warning-600 px-2 py-1 rounded-lg">
                {soonCount} soon
              </span>
            )}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="table-header text-left px-3 py-2.5">Product</th>
              <th className="table-header text-right px-3 py-2.5">Stock</th>
              <th className="table-header text-right px-3 py-2.5">Days Left</th>
              <th className="table-header text-center px-3 py-2.5">Urgency</th>
              <th className="table-header text-right px-3 py-2.5">Order Qty</th>
              <th className="table-header px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 15).map((item) => (
              <tr key={item.product_id} className="border-b border-surface-100">
                <td className="px-3 py-3 text-sm font-medium text-surface-800 max-w-[160px] truncate">{item.product_name}</td>
                <td className="px-3 py-3 text-sm text-right text-surface-600">{item.current_stock}</td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-800">
                  {item.days_until_stockout != null ? `${item.days_until_stockout}d` : '--'}
                </td>
                <td className="px-3 py-3 text-center">
                  <UrgencyBadge urgency={item.reorder_urgency} />
                </td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-800">
                  {item.suggested_reorder_qty > 0 ? item.suggested_reorder_qty : '--'}
                </td>
                <td className="px-3 py-3 text-right">
                  {(item.reorder_urgency === 'reorder_urgent' || item.reorder_urgency === 'reorder_soon') && (
                    <Link
                      href="/suppliers"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Order <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Section D: Expiry Risk ─────────────────────────────────────────────────

function ExpirySection({ data, loading, error }: { data: ExpiryItem[]; loading: boolean; error: string }) {
  if (loading) return <div className="card p-6"><LoadingSpinner /></div>;
  if (error) return <ErrorCard title="Expiry Risk" message={error} />;

  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Expiry Risk Scoring</h3>
        <EmptyState message="Add inventory batches with expiry dates to see risk scoring" icon={AlertTriangle} />
      </div>
    );
  }

  const totalLoss = data.reduce((sum, d) => sum + d.potential_loss, 0);
  const highRisk = data.filter((d) => d.risk_score > 80).length;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-surface-900">Expiry Risk Scoring</h3>
          <p className="text-sm text-surface-500 mt-0.5">{data.length} batches at risk within 180 days</p>
        </div>
        <div className="flex gap-4 text-right">
          {highRisk > 0 && (
            <div>
              <p className="text-xs text-surface-400">High Risk</p>
              <p className="text-sm font-bold text-danger-600">{highRisk} batches</p>
            </div>
          )}
          <div>
            <p className="text-xs text-surface-400">Potential Loss</p>
            <p className="text-sm font-bold text-danger-600">{formatCurrency(totalLoss)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="table-header text-left px-3 py-2.5">Product</th>
              <th className="table-header text-left px-3 py-2.5">Batch</th>
              <th className="table-header text-right px-3 py-2.5">Expiry</th>
              <th className="table-header text-right px-3 py-2.5">Days Left</th>
              <th className="table-header text-right px-3 py-2.5">Qty</th>
              <th className="table-header text-left px-3 py-2.5 min-w-[120px]">Risk</th>
              <th className="table-header text-right px-3 py-2.5">Loss</th>
              <th className="table-header text-center px-3 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 20).map((item) => (
              <tr key={item.batch_id} className="border-b border-surface-100">
                <td className="px-3 py-3 text-sm font-medium text-surface-800 max-w-[160px] truncate">{item.product_name}</td>
                <td className="px-3 py-3 text-sm text-surface-500 font-mono">{item.batch_number || '--'}</td>
                <td className="px-3 py-3 text-sm text-right text-surface-600">{formatShortDate(item.expiry_date)}</td>
                <td className={cn(
                  'px-3 py-3 text-sm text-right font-semibold',
                  item.days_left <= 7 ? 'text-danger-600' : item.days_left <= 30 ? 'text-warning-600' : 'text-surface-700',
                )}>
                  {item.days_left <= 0 ? 'Expired' : `${item.days_left}d`}
                </td>
                <td className="px-3 py-3 text-sm text-right text-surface-600">{item.quantity}</td>
                <td className="px-3 py-3">
                  <RiskBar score={item.risk_score} />
                </td>
                <td className="px-3 py-3 text-sm text-right font-semibold text-surface-700">{formatCurrency(item.potential_loss)}</td>
                <td className="px-3 py-3 text-center">
                  <ActionBadge action={item.suggested_action} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-brand-100 text-brand-700',
    medium: 'bg-warning-500/10 text-warning-600',
    low: 'bg-danger-500/10 text-danger-600',
  };
  return (
    <span className={cn('inline-block text-xs font-bold px-2 py-0.5 rounded-md capitalize', styles[level])}>
      {level}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency === 'reorder_urgent') {
    return <span className="text-xs font-bold bg-danger-500/10 text-danger-600 px-2 py-0.5 rounded-md">Urgent</span>;
  }
  if (urgency === 'reorder_soon') {
    return <span className="text-xs font-bold bg-warning-500/10 text-warning-600 px-2 py-0.5 rounded-md">Soon</span>;
  }
  if (urgency === 'no_sales_data') {
    return <span className="text-xs font-bold bg-surface-200 text-surface-500 px-2 py-0.5 rounded-md">No data</span>;
  }
  return <span className="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-md">OK</span>;
}

function RiskBar({ score }: { score: number }) {
  const color = score > 80 ? 'bg-danger-500' : score >= 50 ? 'bg-warning-500' : 'bg-brand-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-surface-600 w-7 text-right">{score}</span>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  if (action === 'discount_now') {
    return (
      <Link href="/inventory" className="inline-flex text-xs font-bold bg-danger-500/10 text-danger-600 px-2 py-0.5 rounded-md hover:bg-danger-500/20">
        Discount
      </Link>
    );
  }
  if (action === 'monitor') {
    return <span className="text-xs font-bold bg-warning-500/10 text-warning-600 px-2 py-0.5 rounded-md">Monitor</span>;
  }
  return <span className="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-md">Safe</span>;
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-surface-900 mb-2">{title}</h3>
      <div className="p-3 bg-danger-500/10 text-danger-600 text-sm font-medium rounded-xl border border-danger-500/20">
        {message}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${year?.slice(2)}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' });
}
