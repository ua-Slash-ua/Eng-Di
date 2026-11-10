import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Compares the current draft with the last saved snapshot so action buttons can stay disabled
 * until something actually changes. The baseline is captured once the record is loaded (`ready`);
 * `markSaved()` drops it so the next commit becomes the new baseline — that way values the server
 * normalized on save (trimmed slugs, rounded numbers) do not read as unsaved changes.
 */
export function useDirtyForm<T>(draft: T, ready = true) {
  const serialized = JSON.stringify(draft);
  const [baseline, setBaseline] = useState<string | null>(null);
  const latest = useRef(serialized);
  latest.current = serialized;

  useEffect(() => {
    if (ready && baseline === null) {
      setBaseline(latest.current);
    }
  }, [ready, baseline]);

  const markSaved = useCallback(() => setBaseline(null), []);

  return { dirty: baseline !== null && baseline !== serialized, markSaved };
}
