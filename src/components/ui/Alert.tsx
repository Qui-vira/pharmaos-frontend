'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variantConfig: Record<string, { icon: LucideIcon; bg: string; border: string; icon_color: string; title_color: string; text_color: string }> = {
  info: {
    icon: Info,
    bg: 'bg-info-500/5',
    border: 'border-info-500/20',
    icon_color: 'text-info-600',
    title_color: 'text-info-700',
    text_color: 'text-info-600',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-brand-50',
    border: 'border-brand-200',
    icon_color: 'text-brand-600',
    title_color: 'text-brand-700',
    text_color: 'text-brand-600',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning-500/5',
    border: 'border-warning-500/20',
    icon_color: 'text-warning-600',
    title_color: 'text-warning-700',
    text_color: 'text-warning-600',
  },
  danger: {
    icon: XCircle,
    bg: 'bg-danger-500/5',
    border: 'border-danger-500/20',
    icon_color: 'text-danger-600',
    title_color: 'text-danger-700',
    text_color: 'text-danger-600',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border p-4',
        config.bg,
        config.border,
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.icon_color)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('text-sm font-semibold mb-1', config.title_color)}>
            {title}
          </p>
        )}
        <div className={cn('text-sm', config.text_color)}>{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'shrink-0 mt-0.5 hover:opacity-70 transition-opacity',
            config.icon_color,
          )}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
