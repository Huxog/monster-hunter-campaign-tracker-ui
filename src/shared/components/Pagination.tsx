import { useState } from 'react';
import { tv } from 'tailwind-variants';
import type { PaginatedMeta } from '../types/api';

interface PaginationProps {
  meta: PaginatedMeta;
  onPageChange: (page: number) => void;
}

const pageBtn = tv({
  base: 'inline-flex items-center rounded px-3 h-8 text-sm font-medium border transition-colors',
  variants: {
    enabled: {
      true: 'border-primary/20 bg-surface-alt text-cream hover:bg-surface hover:border-primary/40 cursor-pointer',
      false: 'border-transparent text-muted opacity-40 cursor-not-allowed',
    },
  },
});

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { current_page, last_page, total, per_page } = meta;
  const [jumpValue, setJumpValue] = useState('');

  if (last_page <= 1) return null;

  const from = (current_page - 1) * per_page + 1;
  const to = Math.min(current_page * per_page, total);

  function handleJump(e: React.FormEvent) {
    e.preventDefault();
    const p = parseInt(jumpValue, 10);
    if (!isNaN(p) && p >= 1 && p <= last_page && p !== current_page) {
      onPageChange(p);
    }
    setJumpValue('');
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 pt-4">
      <p className="text-xs text-muted">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={current_page <= 1}
          onClick={() => onPageChange(1)}
          className={pageBtn({ enabled: current_page > 1 })}
          title="First page"
        >
          «
        </button>
        <button
          type="button"
          disabled={current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
          className={pageBtn({ enabled: current_page > 1 })}
        >
          ‹ Prev
        </button>

        <form onSubmit={handleJump} className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={last_page}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder={String(current_page)}
            className="h-8 w-14 rounded border border-primary/20 bg-surface-alt px-2 text-center text-sm tabular-nums text-cream placeholder:text-muted focus:border-primary/50 focus:outline-none"
            aria-label="Jump to page"
          />
          <span className="text-sm text-muted">/ {last_page}</span>
        </form>

        <button
          type="button"
          disabled={current_page >= last_page}
          onClick={() => onPageChange(current_page + 1)}
          className={pageBtn({ enabled: current_page < last_page })}
        >
          Next ›
        </button>
        <button
          type="button"
          disabled={current_page >= last_page}
          onClick={() => onPageChange(last_page)}
          className={pageBtn({ enabled: current_page < last_page })}
          title="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
}
