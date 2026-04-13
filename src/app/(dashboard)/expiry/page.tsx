'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlurFade } from '@/components/shadcn/blur-fade';
import { StatCard, DataTable, StatusBadge, LoadingSpinner } from '@/components/ui';
import { AlertTriangle, Clock, XCircle, ShieldAlert, Calendar } from 'lucide-react';
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
          <p className="font-semibold text-surface-800 dark:text-surface-100">{item.product_name || 'Unknown'}</p>
          <p className="text-xs text-surface-400 dark:text-surface-500 font-mono">Batch: {item.batch?.batch_number || '\u2014'}</p>
        </div>
      ),
    },
    {
      key: 'expiry_date',
      header: 'Expiry Date',
      render: (item: any) => (
        <span className="text-sm text-surface-700 dark:text-surface-300">
          {item.batch?.expiry_date ? formatDate(item.batch.expiry_date) : '\u2014'}
        </span>
      ),
    },
    {
      key: 'days_left',
      header: 'Time Left',
      render: (item: any) => {
        if (!item.batch?.expiry_date) return <span className="text-surface-400 dark:text-surface-500">\u2014</span>;
        const days = Math.ceil((new Date(item.batch.expiry_date).getTime() - Date.now()) / 86400000);
        return (
          <span
            className={cn('font-semibold text-sm', {
              'text-danger-600 dark:text-danger-400': days <= 0,
              'text-danger-500 dark:text-danger-400': days > 0 && days <= 7,
              'text-warning-600 dark:text-warning-400': days > 7 && days <= 30,
              'text-warning-500 dark:text-warning-400': days > 30 && days <= 90,
              'text-surface-500 dark:text-surface-400': days > 90,
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
      render: (item: any) => <span className="font-semibold text-surface-800 dark:text-surface-200">{item.batch?.quantity || 0}</span>,
    },
    {
      key: 'cost_price',
      header: 'Cost Price',
      render: (item: any) => (
        <span className="font-semibold text-surface-800 dark:text-surface-200">
          \u20A6{item.batch?.cost_price ? Number(item.batch.cost_price).toLocaleString() : '0'}
        </span>
      ),
    },
    {
      key: 'selling_price',
      header: 'Selling Price',
      render: (item: any) => {
        const price = item?.batch?.selling_price;
        return (
          <span className="font-semibold text-surface-800 dark:text-surface-200">
            \u20A6{price ? parseFloat(price).toLocaleString() : '0'}
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
          <span className="badge bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">Resolved</span>
        ) : (
          <span className="badge bg-danger-500/10 dark:bg-danger-500/20 text-danger-600 dark:text-danger-400">Active</span>
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

  // Determine card style based on alert type
  const getCardStyle = (alertType: string) => {
    switch (alertType) {
      case 'expired':
        return 'border-danger-500/50 dark:border-danger-500/40 shadow-danger-500/10 dark:shadow-danger-500/5 animate-glow-pulse';
      case 'critical':
        return 'border-danger-400/40 dark:border-danger-400/30 shadow-danger-400/10 dark:shadow-danger-400/5 animate-glow-pulse';
      case 'warning':
        return 'border-amber-400/50 dark:border-amber-400/30 shadow-amber-400/10 dark:shadow-amber-400/5';
      case 'approaching':
        return 'border-emerald-400/50 dark:border-emerald-400/30 shadow-emerald-400/10 dark:shadow-emerald-400/5';
      default:
        return 'border-surface-200 dark:border-surface-700';
    }
  };

  const getGlowColor = (alertType: string) => {
    switch (alertType) {
      case 'expired':
        return 'bg-danger-500/5 dark:bg-danger-500/10';
      case 'critical':
        return 'bg-danger-400/5 dark:bg-danger-400/10';
      case 'warning':
        return 'bg-amber-400/5 dark:bg-amber-400/10';
      case 'approaching':
        return 'bg-emerald-400/5 dark:bg-emerald-400/10';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900">
      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BlurFade delay={0.05}>
            <StatCard label="Expired" value={expiredCount} icon={XCircle} color="danger" />
          </BlurFade>
          <BlurFade delay={0.1}>
            <StatCard label="Critical (7 days)" value={criticalCount} icon={AlertTriangle} color="warning" />
          </BlurFade>
          <BlurFade delay={0.15}>
            <StatCard label="Warning (30 days)" value={warningCount} icon={Clock} color="info" />
          </BlurFade>
        </div>

        {/* Tab filter with animated indicator */}
        <BlurFade delay={0.2}>
          <div className="card bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
            <div className="px-5 py-3 border-b border-surface-200 dark:border-surface-700 flex gap-1 overflow-x-auto relative">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap z-10',
                    filter === f.key
                      ? 'text-white'
                      : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700',
                  )}
                >
                  {filter === f.key && (
                    <motion.div
                      layoutId="expiry-tab-indicator"
                      className="absolute inset-0 bg-brand-600 dark:bg-brand-500 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{f.label} <span className="ml-1 opacity-70">{f.count}</span></span>
                </button>
              ))}
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                emptyMessage="No expiry alerts. Add batches with expiry dates to track them."
              />
            )}
          </div>
        </BlurFade>

        {/* Color-coded glass cards for filtered items */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((item: any, idx: number) => {
              const days = item.batch?.expiry_date
                ? Math.ceil((new Date(item.batch.expiry_date).getTime() - Date.now()) / 86400000)
                : null;

              return (
                <BlurFade key={item.id || idx} delay={0.05 * idx}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * idx, duration: 0.35 }}
                    className={cn(
                      'relative rounded-2xl border p-4 backdrop-blur-sm shadow-lg transition-all',
                      'bg-white/80 dark:bg-surface-800/60',
                      getCardStyle(item.alert_type),
                    )}
                  >
                    {/* Glow background */}
                    <div className={cn('absolute inset-0 rounded-2xl', getGlowColor(item.alert_type))} />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-surface-900 dark:text-surface-50 text-sm">
                            {item.product_name || 'Unknown'}
                          </h4>
                          <p className="text-xs text-surface-400 dark:text-surface-500 font-mono mt-0.5">
                            Batch: {item.batch?.batch_number || '\u2014'}
                          </p>
                        </div>
                        <StatusBadge status={item.alert_type} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.batch?.expiry_date ? formatDate(item.batch.expiry_date) : '\u2014'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-surface-400 dark:text-surface-500" />
                          <span
                            className={cn('font-semibold', {
                              'text-danger-600 dark:text-danger-400': days !== null && days <= 7,
                              'text-amber-600 dark:text-amber-400': days !== null && days > 7 && days <= 30,
                              'text-emerald-600 dark:text-emerald-400': days !== null && days > 30,
                            })}
                          >
                            {days === null ? '\u2014' : days <= 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                          </span>
                        </div>
                        <div className="text-surface-600 dark:text-surface-400">
                          Qty: <span className="font-semibold text-surface-800 dark:text-surface-200">{item.batch?.quantity || 0}</span>
                        </div>
                        <div className="text-surface-600 dark:text-surface-400">
                          Cost: <span className="font-semibold text-surface-800 dark:text-surface-200">\u20A6{item.batch?.cost_price ? Number(item.batch.cost_price).toLocaleString() : '0'}</span>
                        </div>
                      </div>

                      {item.is_resolved && (
                        <div className="mt-3 text-xs font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Resolved
                        </div>
                      )}
                    </div>
                  </motion.div>
                </BlurFade>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {alerts.length === 0 && !loading && (
          <BlurFade delay={0.1}>
            <div className="card bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <h3 className="font-bold text-surface-700 dark:text-surface-200 mb-1">No Expiry Alerts Yet</h3>
              <p className="text-sm text-surface-400 dark:text-surface-500">
                Expiry alerts are generated when you add batches with expiry dates to your inventory.
                Go to Inventory &rarr; click &ldquo;Add Batch&rdquo; on any product to start tracking.
              </p>
            </div>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
