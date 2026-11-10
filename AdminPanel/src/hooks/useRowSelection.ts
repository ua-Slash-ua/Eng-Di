'use client';

import { useCallback, useMemo, useState } from 'react';

export function useRowSelection() {
  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  const selectedIds = useMemo(() => [...selected], [selected]);
  const count = selected.size;

  const isSelected = useCallback((id: number) => selected.has(id), [selected]);

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: number[]) => {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const pruneTo = useCallback((ids: number[]) => {
    const allowed = new Set(ids);
    setSelected((prev) => {
      const next = new Set<number>();
      prev.forEach((id) => {
        if (allowed.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, []);

  return { selected, selectedIds, count, isSelected, toggle, toggleAll, clear, pruneTo };
}
