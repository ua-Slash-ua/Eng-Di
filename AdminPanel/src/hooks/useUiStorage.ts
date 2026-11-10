'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  clearUiStorage,
  getServerUiStorageSnapshot,
  getUiStorageSnapshot,
  setGeneralDefaultLimit,
  setMediaView,
  setStoredPageSize,
  subscribeUiStorage,
  updateUiStorage,
  type MediaSectionKey,
  type MediaViewMode,
  type PageSize,
} from '@/lib/uiStorage';

export function useUiStorage() {
  const storage = useSyncExternalStore(
    subscribeUiStorage,
    getUiStorageSnapshot,
    getServerUiStorageSnapshot,
  );

  const setDefaultLimit = useCallback((limit: PageSize) => {
    setGeneralDefaultLimit(limit);
  }, []);

  const setTableLimit = useCallback((path: string, limit: PageSize) => {
    setStoredPageSize(path, limit);
  }, []);

  const setSectionView = useCallback((section: MediaSectionKey, view: MediaViewMode) => {
    setMediaView(section, view);
  }, []);

  const setSectionLimit = useCallback((section: MediaSectionKey, limit: PageSize) => {
    const path = section === 'icons' ? '/icons' : section === 'images' ? '/images' : '/videos';
    setStoredPageSize(path, limit);
  }, []);

  const clear = useCallback(() => {
    clearUiStorage();
  }, []);

  const resetSection = useCallback((section: MediaSectionKey) => {
    updateUiStorage((draft) => {
      draft.media[section] = { view: 'list' };
      const path = section === 'icons' ? '/icons' : section === 'images' ? '/images' : '/videos';
      delete draft.tables[path];
    });
  }, []);

  return {
    storage,
    setDefaultLimit,
    setTableLimit,
    setSectionView,
    setSectionLimit,
    resetSection,
    clear,
  };
}
