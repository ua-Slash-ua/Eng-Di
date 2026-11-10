export type RuleListItem = {
  id: number;
  title: string;
  description: string;
  accent: number;
};

export type RuleItem = {
  id: number;
  title: string;
  description: string;
  accent: number;
  createdAt: string;
  updatedAt: string;
};

export const ACCENT_LABELS: Record<number, string> = {
  1: 'Рожевий',
  2: 'Фіолетовий',
  3: 'Помаранчевий',
  4: 'Мʼятний',
  5: 'Жовтий',
};

const ACCENT_COLORS: Record<number, string> = {
  1: '#ff6fa5',
  2: '#8b6ff0',
  3: '#ff9f5a',
  4: '#3fd8b5',
  5: '#ffd24d',
};

export const ACCENT_OPTIONS = Object.entries(ACCENT_LABELS).map(([value, label]) => ({
  value,
  label,
  swatch: ACCENT_COLORS[Number(value)],
}));
