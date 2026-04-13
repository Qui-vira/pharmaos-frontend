'use client';

import { cn } from '@/lib/utils';

export function SkeletonLine({
  width = '100%',
  height = '1rem',
}: {
  width?: string;
  height?: string;
}) {
  return (
    <div
      className="animate-pulse rounded-md bg-surface-200"
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 space-y-3">
      <SkeletonLine width="40%" height="1.25rem" />
      <SkeletonLine width="100%" height="0.875rem" />
      <SkeletonLine width="75%" height="0.875rem" />
      <div className="flex gap-2 pt-2">
        <SkeletonLine width="5rem" height="2rem" />
        <SkeletonLine width="5rem" height="2rem" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-surface-200">
      {/* Header row */}
      <div
        className="grid gap-4 border-b border-surface-200 bg-surface-50 px-4 py-3"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLine key={`head-${i}`} width="70%" height="0.75rem" />
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className={cn(
            'grid gap-4 px-4 py-3',
            rowIdx < rows - 1 && 'border-b border-surface-100'
          )}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonLine
              key={`cell-${rowIdx}-${colIdx}`}
              width={colIdx === 0 ? '85%' : '60%'}
              height="0.875rem"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
