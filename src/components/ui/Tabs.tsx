'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export function Tabs({
  tabs,
  active,
  onChange,
  variant = 'pills',
  className,
}: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1',
        variant === 'underline' && 'border-b border-surface-200 gap-0',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'relative px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
            variant === 'pills' &&
              'rounded-lg',
            variant === 'pills' &&
              tab.key !== active &&
              'text-surface-600 hover:text-surface-900 hover:bg-surface-100',
            variant === 'underline' &&
              'pb-3',
            variant === 'underline' &&
              tab.key !== active &&
              'text-surface-500 hover:text-surface-700'
          )}
        >
          {/* Active indicator */}
          {tab.key === active && variant === 'pills' && (
            <motion.div
              layoutId="tab-pill"
              className="absolute inset-0 rounded-lg bg-brand-600"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          {tab.key === active && variant === 'underline' && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}

          {/* Label + count */}
          <span
            className={cn(
              'relative z-10 flex items-center gap-1.5',
              variant === 'pills' && tab.key === active && 'text-white',
              variant === 'underline' && tab.key === active && 'text-brand-700'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none',
                  variant === 'pills' && tab.key === active
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-200 text-surface-600',
                  variant === 'underline' && tab.key === active
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-surface-200 text-surface-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
