'use client';

// ─── PharmaOS UI Component Library — Barrel Re-exports ─────────────────────
// All components are individually defined in their own files.
// This barrel file maintains backwards compatibility with existing imports.

// Phase 1 — Original components (extracted)
export { StatCard, ContentCard, FeatureCard } from './Card';
export { StatusBadge, Badge } from './Badge';
export { DataTable } from './DataTable';
export type { Column } from './DataTable';
export { Pagination } from './Pagination';
export { EmptyState } from './EmptyState';
export { LoadingSpinner } from './LoadingSpinner';
export { Modal } from './Modal';

// Phase 3 — New foundational components
export { Button } from './Button';
export { Input } from './Input';
export { Textarea } from './Textarea';
export { Select } from './Select';
export { SearchInput } from './SearchInput';
export { Alert } from './Alert';
export { ProgressBar } from './ProgressBar';
export { Avatar } from './Avatar';

// Phase 4 — Advanced components
export { Tabs } from './Tabs';
export { Tooltip } from './Tooltip';
export { SkeletonLine, SkeletonCard, SkeletonTable } from './Skeleton';
export { Stepper } from './Stepper';
export { ToastProvider, useToast } from './Toast';

// Phase 5 — Glass & animation components
export { default as GlassCard } from './GlassCard';
