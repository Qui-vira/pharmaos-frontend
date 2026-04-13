'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Variant config                                                     */
/* ------------------------------------------------------------------ */

const variantConfig: Record<
  NonNullable<Toast['variant']>,
  { icon: typeof CheckCircle; iconClass: string; barClass: string }
> = {
  success: {
    icon: CheckCircle,
    iconClass: 'text-green-500',
    barClass: 'bg-green-500',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-danger-500',
    barClass: 'bg-danger-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning-500',
    barClass: 'bg-warning-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-info-500',
    barClass: 'bg-info-500',
  },
};

/* ------------------------------------------------------------------ */
/*  Single toast card                                                  */
/* ------------------------------------------------------------------ */

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const variant = toast.variant ?? 'info';
  const config = variantConfig[variant];
  const Icon = config.icon;

  useEffect(() => {
    const timeout = setTimeout(
      () => onDismiss(toast.id),
      toast.duration ?? 5000
    );
    return () => clearTimeout(timeout);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
      className="pointer-events-auto w-80 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-surface-200"
    >
      {/* Accent bar */}
      <div className={cn('h-1', config.barClass)} />

      <div className="flex items-start gap-3 p-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.iconClass)} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-0.5 text-xs text-surface-500">
              {toast.description}
            </p>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-md p-1 text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
