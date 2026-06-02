import type { PaginatedMeta } from '../types/api';

const DEFAULT_PER_PAGE = 20;

export function paginateItems<T>(
  items: T[],
  page: number,
  perPage = DEFAULT_PER_PAGE,
): { pageItems: T[]; meta: PaginatedMeta } {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const clampedPage = Math.min(Math.max(1, page), lastPage);
  return {
    pageItems: items.slice((clampedPage - 1) * perPage, clampedPage * perPage),
    meta: { current_page: clampedPage, last_page: lastPage, per_page: perPage, total },
  };
}
