import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function useResource<T>(path: string | null) {
  const [item, setItem] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(path));

  const reload = useCallback(() => {
    if (!path) {
      return Promise.resolve();
    }
    setLoading(true);
    return api<T>(path)
      .then((data) => {
        setItem(data);
        setError('');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'))
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  return { item, setItem, error, setError, loading, reload };
}
