'use client';

import { cn } from '@/lib/utils';

// ─── Pagination ────────────────────────────────────────────────────────────

export function Pagination({
  page,
  pages,
  total,
  onPageChange,
  pageSize,
}: {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}) {
  if (pages <= 1) return null;

  // Build page numbers with ellipsis for >7 pages
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    const items: (number | 'ellipsis')[] = [1];

    if (page > 3) {
      items.push('ellipsis');
    }

    const start = Math.max(2, page - 1);
    const end = Math.min(pages - 1, page + 1);

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (page < pages - 2) {
      items.push('ellipsis');
    }

    items.push(pages);

    return items;
  };

  // "Showing X-Y of Z" calculation
  const showingText = pageSize
    ? (() => {
        const from = (page - 1) * pageSize + 1;
        const to = Math.min(page * pageSize, total);
        return `Showing ${from}-${to} of ${total}`;
      })()
    : `${total} items`;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
      <p className="text-sm text-surface-500">{showingText}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {getPageNumbers().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm text-surface-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-8 h-8 text-sm font-medium rounded-lg',
                p === page ? 'bg-brand-600 text-white' : 'hover:bg-surface-100 text-surface-600',
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
