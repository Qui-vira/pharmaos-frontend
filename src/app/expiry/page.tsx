'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { StatCard, DataTable, StatusBadge, LoadingSpinner } from '@/components/ui';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { inventoryApi } from '@/lib/api';

export default function ExpiryPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.expiryAlerts(false);
      setAlerts(data || []);
    } catch (err) {
      console.error('Failed to load expiry alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filtered = filter === 'all' ? alerts : alerts.filter((a: any) => a.alert_type === filter);

  const expiredCount = alerts.filter((a: any) => a.alert_type === 'expired').length;
  const criticalCount = alerts.filter((a: any) => a.alert_type === 'critical').length;
  const warningCount = alerts.filter((a: any) => a.alert_type === 'warning').length;
  const approachingCount = alerts.filter((a: any) => a.alert_type === 'approaching').length;

  const columns = [
  {
    key: 'product',
    header: 'Product',
    render: (item: any) => (
      <div>
        <p className="font-semibold text-surface-800">{item.product_name || 'Unknown'}</p>
        <p className="text-xs text-surface-400 font-mono">Batch: {item.batch?.batch_number || '—'}</p>
      </div>
    ),
  },
  {
    key: 'expiry_date',
    header: 'Expiry Date',
    render: (item: any) => (
      <span className="text-sm">
        {item.batch?.expiry_date ? formatDate(item.batch.expiry_date) : '—'}
      </span>
    ),
  },
  {
    key: 'days_left',
    header: 'Time Left',
    render: (item: any) => {
      if (!item.batch?.expiry_date) return <span className="text-surface-400">—</span>;
      const days = Math.ceil((new Date(item.batch.expiry_date).getTime() - Date.now()) / 86400000);
      return (
        <span
          className={cn('font-semibold text-sm', {
            'text-danger-600': days <= 0,
            'text-danger-500': days > 0 && days <= 7,
            'text-warning-600': days > 7 && days <= 30,
            'text-warning-500': days > 30 && days <= 90,
            'text-surface-500': days > 90,
          })}
        >
          {days <= 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
        </span>
      );
    },
  },
  {
    key: 'quantity',
    header: 'Qty',
    render: (item: any) => <span className="font-semibold">{item.batch?.quantity || 0}</span>,
  },
 {
  key: 'cost_price',
  header: 'Cost Price',
  render: (item: any) => (
    <span className="font-semibold">
      ₦{item.batch?.cost_price ? Number(item.batch.cost_price).toLocaleString() : '0'}
    </span>
  ),
},
 {
  key: 'selling_price',
  header: 'Selling Price',
  render: (item: any) => {
    const price = item?.batch?.selling_price;
    return (
      <span className="font-semibold">
        ₦{price ? parseFloat(price).toLocaleString() : '0'}
      </span>
    );
  },
},
  {
    key: 'alert_type',
    header: 'Severity',
    render: (item: any) => <StatusBadge status={item.alert_type} />,
  },
  {
    key: 'is_resolved',
    header: 'Status',
    render: (item: any) =>
      item.is_resolved ? (
        <span className="badge bg-brand-100 text-brand-700">Resolved</span>
      ) : (
        <span className="badge bg-danger-500/10 text-danger-600">Active</span>
      ),
  },
];

  const filters = [
    { key: 'all', label: 'All Alerts', count: alerts.length },
    { key: 'expired', label: 'Expired', count: expiredCount },
    { key: 'critical', label: 'Critical (7d)', count: criticalCount },
    { key: 'warning', label: 'Warning (30d)', count: warningCount },
    { key: 'approaching', label: 'Approaching (90d)', count: approachingCount },
  ];

  return (
    <>
      <Header title="Expiry Alerts" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Expired" value={expiredCount} icon={XCircle} color="danger" />
          <StatCard label="Critical (7 days)" value={criticalCount} icon={AlertTriangle} color="warning" />
          <StatCard label="Warning (30 days)" value={warningCount} icon={Clock} color="info" />
        </div>

        <div className="card">
          <div className="px-5 py-3 border-b border-surface-200 flex gap-1 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  filter === f.key ? 'bg-brand-600 text-white' : 'text-surface-500 hover:bg-surface-100',
                )}
              >
                {f.label} <span className="ml-1 opacity-70">{f.count}</span>
              </button>
            ))}
          </div>

          {loading ? <LoadingSpinner /> : (
            <DataTable columns={columns} data={filtered} emptyMessage="No expiry alerts. Add batches with expiry dates to track them." />
          )}
        </div>

        {alerts.length === 0 && !loading && (
          <div className="card p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <h3 className="font-bold text-surface-700 mb-1">No Expiry Alerts Yet</h3>
            <p className="text-sm text-surface-400">
              Expiry alerts are generated when you add batches with expiry dates to your inventory.
              Go to Inventory → click "Add Batch" on any product to start tracking.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
