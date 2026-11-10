export const UI_SETTING_KEY = 'ui';

export type UiSettings = {
  /** When true, UserPanel shows the spiky “New” badge on marked menu/tab items. */
  showNewBadges: boolean;
};

export const DEFAULT_UI_SETTINGS: UiSettings = {
  showNewBadges: true,
};

export function normalizeUiSettings(raw: unknown): UiSettings {
  const base: UiSettings = { ...DEFAULT_UI_SETTINGS };
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Partial<UiSettings>;
  if (typeof data.showNewBadges === 'boolean') {
    base.showNewBadges = data.showNewBadges;
  }
  return base;
}
