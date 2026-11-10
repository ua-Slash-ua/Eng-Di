import { useCallback, useState } from 'react';
import type { UsageItem } from '@/components/ConfirmDialog';
import { api } from '@/lib/api';

export function useConfirmDelete<TUsage = UsageItem>(mapUsage?: (rows: unknown) => UsageItem[]) {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<UsageItem[] | undefined>(undefined);
  const [usageLoading, setUsageLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const ask = useCallback(
    (usagePath?: string) => {
      setOpen(true);
      if (!usagePath) {
        setUsage([]);
        return;
      }
      setUsage(undefined);
      setUsageLoading(true);
      api<TUsage[]>(usagePath)
        .then((rows) => setUsage(mapUsage ? mapUsage(rows) : (rows as UsageItem[])))
        .catch(() => setUsage([]))
        .finally(() => setUsageLoading(false));
    },
    [mapUsage],
  );

  const close = useCallback(() => setOpen(false), []);

  const runDelete = useCallback(async (action: () => Promise<void>) => {
    setRemoving(true);
    try {
      await action();
    } finally {
      setRemoving(false);
    }
  }, []);

  return { open, usage, usageLoading, removing, ask, close, runDelete, setOpen };
}
