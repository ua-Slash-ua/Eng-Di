'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  getStoredPageSize,
  setStoredPageSize,
  subscribeUiStorage,
  type PageSize,
} from '@/lib/uiStorage';
import { useDebouncedValue } from './useDebouncedValue';

export { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS };
export type { PageSize };

export type SortOrder = 'asc' | 'desc';

export type TableQuery = {
  q: string;
  qInput: string;
  setQInput: (value: string) => void;
  page: number;
  limit: number;
  sort: string;
  order: SortOrder;
  toggleSort: (key: string) => void;
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  hasActiveFilters: boolean;
  reset: () => void;
};

function isPageSize(value: number): value is PageSize {
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

/**
 * Keeps list state (search, sorting, page, filters) in the URL.
 * Per-page size is remembered in nested UI storage when not present in the URL.
 */
export function useTableQuery(basePath: string, filterKeys: readonly string[] = []): TableQuery {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? '';
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const page = Math.max(1, Number(params.get('page')) || 1);
  const limitParam = Number(params.get('limit'));
  const hasUrlLimit = isPageSize(limitParam);
  const storedLimit = useSyncExternalStore(
    subscribeUiStorage,
    () => getStoredPageSize(basePath),
    () => DEFAULT_PAGE_SIZE,
  );
  const limit = hasUrlLimit ? limitParam : storedLimit;

  const sort = params.get('sort') ?? '';
  const order: SortOrder = params.get('order') === 'desc' ? 'desc' : 'asc';

  const [qInput, setQInput] = useState(() => params.get('q') ?? '');
  const q = useDebouncedValue(qInput.trim(), 300);

  const filterKey = filterKeys.join(',');
  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    for (const key of filterKey ? filterKey.split(',') : []) {
      result[key] = params.get(key) ?? '';
    }
    return result;
  }, [filterKey, params]);

  const navigate = useCallback(
    (mutate: (next: URLSearchParams) => void, replace = false) => {
      const next = new URLSearchParams(search);
      mutate(next);
      const query = next.toString();
      const url = query ? `${basePath}?${query}` : basePath;
      if (replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [basePath, router, search],
  );

  useEffect(() => {
    const urlQ = params.get('q') ?? '';
    if (q === urlQ) {
      return;
    }
    navigate((next) => {
      if (q) {
        next.set('q', q);
      } else {
        next.delete('q');
      }
      next.delete('page');
    }, true);
  }, [q, params, navigate]);

  const setPage = useCallback(
    (value: number) => {
      navigate((next) => {
        if (value > 1) {
          next.set('page', String(value));
        } else {
          next.delete('page');
        }
      });
    },
    [navigate],
  );

  const setLimit = useCallback(
    (value: number) => {
      if (!isPageSize(value)) return;
      setStoredPageSize(basePath, value);
      navigate((next) => {
        if (value !== DEFAULT_PAGE_SIZE) {
          next.set('limit', String(value));
        } else {
          next.delete('limit');
        }
        next.delete('page');
      });
    },
    [basePath, navigate],
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      navigate((next) => {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.delete('page');
      });
    },
    [navigate],
  );

  const toggleSort = useCallback(
    (key: string) => {
      navigate((next) => {
        if (sort === key && order === 'asc') {
          next.set('sort', key);
          next.set('order', 'desc');
        } else if (sort === key && order === 'desc') {
          next.delete('sort');
          next.delete('order');
        } else {
          next.set('sort', key);
          next.delete('order');
        }
        next.delete('page');
      });
    },
    [navigate, sort, order],
  );

  const reset = useCallback(() => {
    setQInput('');
    router.push(basePath);
  }, [basePath, router]);

  const hasActiveFilters = Boolean(qInput || sort || Object.values(filters).some(Boolean));

  return {
    q,
    qInput,
    setQInput,
    page,
    limit,
    sort,
    order,
    toggleSort,
    filters,
    setFilter,
    setPage,
    setLimit,
    hasActiveFilters,
    reset,
  };
}
