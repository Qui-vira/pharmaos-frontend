'use client';

import { ReactNode } from 'react';
import { cn, getStatusColor } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// ─── Status Badge ──────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ');
  return (
    <span className={cn('badge capitalize', getStatusColor(status))}>
      {label}
    </span>
  );
}

// ─── Generic Badge ─────────────────────────────────────────────────────────

const variantStyles: Record<string, string> = {
  success: 'bg-brand-100 text-brand-700 border-brand-200',
  warning: 'bg-warning-500/10 text-warning-700 border-warning-200',
  danger: 'bg-danger-500/10 text-danger-700 border-danger-200',
  info: 'bg-info-500/10 text-info-700 border-info-200',
  default: 'bg-surface-100 text-surface-600 border-surface-200',
};

const dotColors: Record<string, string> = {
  success: 'bg-brand-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500',
  default: 'bg-surface-400',
};

export function Badge({
  children,
  variant = 'default',
  dot,
  icon: Icon,
}: {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  dot?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variantStyles[variant],
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
