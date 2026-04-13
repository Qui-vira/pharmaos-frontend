'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
}

const variantClasses: Record<string, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 bg-transparent hover:bg-surface-100 text-surface-700 focus:outline-none focus:ring-2 focus:ring-surface-400/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 border border-surface-300 bg-transparent hover:bg-surface-50 text-surface-700 focus:outline-none focus:ring-2 focus:ring-surface-400/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
};

const sizeClasses: Record<string, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3',
};

const iconSizes: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon: Icon,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(variantClasses[variant], sizeClasses[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className={cn('animate-spin', iconSizes[size])} />
        ) : Icon ? (
          <Icon className={iconSizes[size]} />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
