'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ─── Loading Spinner ───────────────────────────────────────────────────────

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className={cn('text-brand-500 animate-spin', sizeClasses[size])} />
    </div>
  );
}
