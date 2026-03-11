'use client';

import { ReactNode } from 'react';
import { cn, getStatusColor } from '@/lib/utils';
import { LucideIcon, Inbox, Loader2 } from 'lucide-react';

// ─── Stat Card ─────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color = 'brand',
}: {
  label: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  color?: 'brand' | 'info' | 'warning' | 'danger';
}) {
  const iconColors = {
    brand: 'bg-brand-100 text-brand-600',
    info: 'bg-info-500/10 text-info-600',
    warning: 'bg-warning-500/10 text-warning-600',
    danger: 'bg-danger-500/10 text-danger-600',
  };

  return (
    <div className="card p-5 stagger-item">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="text-2xl font-extrabold text-surface-900 mt-1 tracking-tight">{value}</p>
          {change && (
            <p className={cn(
              'text-xs font-semibold mt-1',
              change.startsWith('+') ? 'text-brand-600' : change.startsWith('-') ? 'text-danger-500' : 'text-surface-400'
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconColors[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ');
  return (
    <span className={cn('badge capitalize', getStatusColor(status))}>
      {label}
    </span>
  );
}

// ─── Data Table ────────────────────────────────────────────────────────────

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data found',
  loading = false,
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}) {
  if (loading) return <LoadingSpinner />;

  if (data.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-200">
            {columns.map((col) => (
              <th key={col.key} className={cn('table-header text-left px-4 py-3', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={item.id || i}
              className={cn(
                'border-b border-surface-100 stagger-item',
                onRowClick && 'cursor-pointer hover:bg-surface-50 transition-colors',
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3.5 text-sm', col.className)}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────

export function Pagination({
  page,
  pages,
  total,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
      <p className="text-sm text-surface-500">{total} items</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-8 h-8 text-sm font-medium rounded-lg',
                p === page ? 'bg-brand-600 text-white' : 'hover:bg-surface-100 text-surface-600',
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────

export function EmptyState({ message = 'No data found', icon: Icon = Inbox }: { message?: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-surface-400">
      <Icon className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Loading Spinner ───────────────────────────────────────────────────────

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-surface-200 rounded-t-2xl">
          <h2 className="text-lg font-bold text-surface-900">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
