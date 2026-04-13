'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

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
    <div className="card p-5 stagger-item transition-all duration-200 hover:shadow-elevated hover:border-surface-300">
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

// ─── Content Card ──────────────────────────────────────────────────────────

export function ContentCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card p-5 transition-all duration-200', className)}>
      {title && (
        <h3 className="text-base font-bold text-surface-900 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
}

// ─── Feature Card ──────────────────────────────────────────────────────────

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn(
      'card p-5 transition-all duration-200 hover:shadow-elevated hover:border-surface-300',
      className,
    )}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-100 text-brand-600 mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-bold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-500">{description}</p>
    </div>
  );
}
