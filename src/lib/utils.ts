// PharmaOS AI — Utility functions

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-surface-200 text-surface-600',
    submitted: 'bg-info-500/10 text-info-600',
    confirmed: 'bg-brand-100 text-brand-700',
    processing: 'bg-warning-500/10 text-warning-600',
    ready: 'bg-brand-200 text-brand-800',
    picked_up: 'bg-brand-500/10 text-brand-700',
    delivered: 'bg-brand-500/20 text-brand-800',
    cancelled: 'bg-danger-500/10 text-danger-600',
    pending: 'bg-warning-500/10 text-warning-600',
    sent: 'bg-info-500/10 text-info-600',
    failed: 'bg-danger-500/10 text-danger-600',
    responded: 'bg-brand-100 text-brand-700',
    intake: 'bg-surface-200 text-surface-600',
    ai_processing: 'bg-info-500/10 text-info-600',
    pending_review: 'bg-warning-500/10 text-warning-600',
    pharmacist_reviewing: 'bg-info-500/10 text-info-600',
    approved: 'bg-brand-200 text-brand-800',
    completed: 'bg-brand-500/20 text-brand-800',
    approaching: 'bg-warning-500/10 text-warning-600',
    warning: 'bg-warning-500/20 text-warning-600',
    critical: 'bg-danger-500/10 text-danger-600',
    expired: 'bg-danger-500/20 text-danger-600',
  };
  return colors[status] || 'bg-surface-200 text-surface-600';
}

export function getExpiryDaysLabel(expiryDate: string): { label: string; color: string } {
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Expired', color: 'text-danger-600' };
  if (days <= 7) return { label: `${days}d left`, color: 'text-danger-600' };
  if (days <= 30) return { label: `${days}d left`, color: 'text-warning-600' };
  if (days <= 90) return { label: `${days}d left`, color: 'text-warning-500' };
  return { label: `${days}d left`, color: 'text-surface-500' };
}
