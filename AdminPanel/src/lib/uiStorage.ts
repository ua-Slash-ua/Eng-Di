export const UI_STORAGE_KEY = 'engdi_admin_ui';
export const UI_STORAGE_VERSION = 1 as const;

export type MediaViewMode = 'list' | 'grid';
export type PageSize = 10 | 20 | 50 | 100;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE: PageSize = 10;

export type MediaSectionKey = 'icons' | 'images' | 'videos';

export type UiTablePrefs = {
  limit?: PageSize;
};

export type UiMediaSectionPrefs = {
  view?: MediaViewMode;
  limit?: PageSize;
};

export type UiStorage = {
  v: typeof UI_STORAGE_VERSION;
  general: {
    defaultLimit: PageSize;
  };
  tables: Record<string, UiTablePrefs>;
  media: Record<MediaSectionKey, UiMediaSectionPrefs>;
};

export const MEDIA_SECTION_LABELS: Record<MediaSectionKey, string> = {
  icons: 'Іконки',
  images: 'Зображення',
  videos: 'Відео',
};

export const TABLE_PREF_LABELS: Record<string, string> = {
  '/users': 'Користувачі',
  '/pages': 'Сторінки',
  '/blocks': 'Блоки',
  '/faq': 'FAQ',
  '/leads': 'Заявки',
  '/icons': 'Іконки',
  '/images': 'Зображення',
  '/videos': 'Відео',
  '/about-stats': 'Цифри',
  '/formats': 'Формати',
  '/tariffs': 'Тарифи',
  '/rules': 'Правила',
  '/reviews': 'Відгуки',
};

const MEDIA_PATH: Record<string, MediaSectionKey> = {
  '/icons': 'icons',
  '/images': 'images',
  '/videos': 'videos',
};

export function emptyUiStorage(): UiStorage {
  return {
    v: UI_STORAGE_VERSION,
    general: { defaultLimit: DEFAULT_PAGE_SIZE },
    tables: {},
    media: {
      icons: { view: 'list' },
      images: { view: 'list' },
      videos: { view: 'list' },
    },
  };
}

function isPageSize(value: unknown): value is PageSize {
  return value === 10 || value === 20 || value === 50 || value === 100;
}

function isViewMode(value: unknown): value is MediaViewMode {
  return value === 'list' || value === 'grid';
}

function normalize(raw: unknown): UiStorage {
  const base = emptyUiStorage();
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<UiStorage>;

  if (data.general && isPageSize(data.general.defaultLimit)) {
    base.general.defaultLimit = data.general.defaultLimit;
  }

  if (data.tables && typeof data.tables === 'object') {
    for (const [key, prefs] of Object.entries(data.tables)) {
      if (!prefs || typeof prefs !== 'object') continue;
      const next: UiTablePrefs = {};
      if (isPageSize(prefs.limit)) next.limit = prefs.limit;
      if (Object.keys(next).length) base.tables[key] = next;
    }
  }

  if (data.media && typeof data.media === 'object') {
    for (const key of Object.keys(base.media) as MediaSectionKey[]) {
      const prefs = data.media[key];
      if (!prefs || typeof prefs !== 'object') continue;
      if (isViewMode(prefs.view)) base.media[key].view = prefs.view;
      if (isPageSize(prefs.limit)) base.media[key].limit = prefs.limit;
    }
  }

  return base;
}

function migrateLegacyKeys(storage: UiStorage): UiStorage {
  if (typeof window === 'undefined') return storage;
  const next = structuredClone(storage);
  let changed = false;

  for (const [legacy, section] of [
    ['media-view:icons', 'icons'],
    ['media-view:images', 'images'],
    ['media-view:videos', 'videos'],
  ] as const) {
    const value = window.localStorage.getItem(legacy);
    if (!value) continue;
    if (isViewMode(value)) {
      next.media[section].view = value;
      changed = true;
    }
    window.localStorage.removeItem(legacy);
  }

  if (changed) {
    window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(next));
  }

  return changed ? next : storage;
}

type Listener = () => void;
const listeners = new Set<Listener>();

const SERVER_SNAPSHOT = emptyUiStorage();
let clientSnapshot: UiStorage | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeUiStorage(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function loadFromLocalStorage(): UiStorage {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(UI_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return migrateLegacyKeys(normalize(parsed));
  } catch {
    return emptyUiStorage();
  }
}

/** Stable snapshot for useSyncExternalStore — same reference until write. */
export function getUiStorageSnapshot(): UiStorage {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT;
  if (!clientSnapshot) {
    clientSnapshot = loadFromLocalStorage();
  }
  return clientSnapshot;
}

export function getServerUiStorageSnapshot(): UiStorage {
  return SERVER_SNAPSHOT;
}

export function readUiStorage(): UiStorage {
  return getUiStorageSnapshot();
}

export function writeUiStorage(next: UiStorage) {
  if (typeof window === 'undefined') return;
  clientSnapshot = next;
  window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(next));
  emit();
}

export function updateUiStorage(mutate: (draft: UiStorage) => void) {
  const draft = structuredClone(readUiStorage());
  mutate(draft);
  writeUiStorage(draft);
  return draft;
}

export function clearUiStorage() {
  writeUiStorage(emptyUiStorage());
}

export function mediaSectionForPath(basePath: string): MediaSectionKey | null {
  return MEDIA_PATH[basePath] ?? null;
}

export function getStoredPageSize(basePath: string): PageSize {
  const storage = readUiStorage();
  const mediaKey = mediaSectionForPath(basePath);
  if (mediaKey && isPageSize(storage.media[mediaKey].limit)) {
    return storage.media[mediaKey].limit!;
  }
  const tableLimit = storage.tables[basePath]?.limit;
  if (isPageSize(tableLimit)) return tableLimit;
  return storage.general.defaultLimit;
}

export function setStoredPageSize(basePath: string, limit: PageSize) {
  updateUiStorage((draft) => {
    const mediaKey = mediaSectionForPath(basePath);
    if (mediaKey) {
      draft.media[mediaKey].limit = limit;
    }
    draft.tables[basePath] = { ...draft.tables[basePath], limit };
  });
}

export function getMediaView(section: MediaSectionKey): MediaViewMode {
  return readUiStorage().media[section].view ?? 'list';
}

export function setMediaView(section: MediaSectionKey, view: MediaViewMode) {
  updateUiStorage((draft) => {
    draft.media[section].view = view;
  });
}

export function setGeneralDefaultLimit(limit: PageSize) {
  updateUiStorage((draft) => {
    draft.general.defaultLimit = limit;
  });
}

export function tableLabel(path: string) {
  return TABLE_PREF_LABELS[path] || path;
}
