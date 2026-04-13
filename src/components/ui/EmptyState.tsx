'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';

// ─── Empty State ───────────────────────────────────────────────────────────

export function EmptyState({
  message = 'No data found',
  icon: Icon = Inbox,
  description,
  action,
}: {
  message?: string;
  icon?: LucideIcon;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-surface-400">
      <Icon className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm font-medium">{message}</p>
      {description && (
        <p className="text-xs text-surface-400 mt-1 max-w-xs text-center">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
