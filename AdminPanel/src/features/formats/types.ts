export type FormatListItem = {
  id: number;
  title: string;
  description: string;
  icon: string | null;
  accent: number;
};

export type FormatItem = {
  id: number;
  title: string;
  description: string;
  icon: string | null;
  accent: number;
  createdAt: string;
  updatedAt: string;
};

export const ACCENT_LABELS: Record<number, string> = {
  1: 'Рожевий',
  2: 'Бузковий',
  3: 'Мʼятний',
};

const ACCENT_COLORS: Record<number, string> = {
  1: '#ff6fa5',
  2: '#8b6ff0',
  3: '#3fd8b5',
};

export const ACCENT_OPTIONS = Object.entries(ACCENT_LABELS).map(([value, label]) => ({
  value,
  label,
  swatch: ACCENT_COLORS[Number(value)],
}));
