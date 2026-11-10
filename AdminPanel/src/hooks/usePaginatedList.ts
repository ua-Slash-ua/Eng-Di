'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Paginated } from '@/lib/pagination';
import { DEFAULT_PAGE_SIZE, useTableQuery } from './useTableQuery';

export type ListFetcher<T> = (query: {
  q?: string;
  page: number;
  limit: number;
  sort?: string;
  order?: string;
  filters: Record<string, string>;
}) => Promise<Paginated<T>>;

function emptyPage<T>(limit: number): Paginated<T> {
  return { items: [], total: 0, page: 1, limit, pageCount: 1 };
}

/** Binds a paginated admin endpoint to URL-synced search/paging state. */
export function usePaginatedList<T>(basePath: string, fetcher: ListFetcher<T>, filterKeys: readonly string[] = []) {
  const query = useTableQuery(basePath, filterKeys);
  const [data, setData] = useState<Paginated<T>>(() => emptyPage<T>(DEFAULT_PAGE_SIZE));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const { q, page, limit, sort, order } = query;
  const filterSignature = JSON.stringify(query.filters);

  const reload = useCallback(() => {
    setLoading(true);
    return fetcherRef
      .current({
        q: q || undefined,
        page,
        limit,
        sort: sort || undefined,
        order: sort ? order : undefined,
        filters: JSON.parse(filterSignature) as Record<string, string>,
      })
      .then((result) => {
        setError('');
        setData(result);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'))
      .finally(() => setLoading(false));
  }, [q, page, limit, sort, order, filterSignature]);

  useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  return {
    ...query,
    data,
    items: data.items,
    loading,
    error,
    setError,
    reload,
  };
}
