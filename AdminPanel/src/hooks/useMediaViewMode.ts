'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  getMediaView,
  setMediaView,
  subscribeUiStorage,
  type MediaSectionKey,
  type MediaViewMode,
} from '@/lib/uiStorage';

export type { MediaViewMode };

export function useMediaViewMode(section: MediaSectionKey) {
  const view = useSyncExternalStore(
    subscribeUiStorage,
    () => getMediaView(section),
    () => 'list' as MediaViewMode,
  );

  const setMediaViewMode = useCallback(
    (next: MediaViewMode) => {
      setMediaView(section, next);
    },
    [section],
  );

  return [view, setMediaViewMode] as const;
}
