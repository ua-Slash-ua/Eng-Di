export type TariffListItem = {
  id: number;
  title: string;
  lessons: number;
  price: number;
  oldPrice: number | null;
  popular: boolean;
  note: string;
  variant: string;
  lessonPrice?: number;
  installmentCount?: number;
  durationMonths?: number;
  frozenLessonsPerMonth?: number;
};

export type TariffItem = {
  id: number;
  title: string;
  lessons: number;
  price: number;
  oldPrice: number | null;
  popular: boolean;
  note: string;
  variant: string;
  icon: string | null;
  lessonPrice: number;
  installmentCount: number;
  durationMonths: number;
  frozenLessonsPerMonth: number;
  createdAt: string;
  updatedAt: string;
};

export const VARIANT_LABELS: Record<string, string> = {
  start: 'Фіолетовий',
  mid: 'Рожевий',
  pro: 'Помаранчевий',
};

const VARIANT_COLORS: Record<string, string> = {
  start: '#8b6ff0',
  mid: '#ff6fa5',
  pro: '#ff9f5a',
};

export const VARIANT_OPTIONS = Object.entries(VARIANT_LABELS).map(([value, label]) => ({
  value,
  label,
  swatch: VARIANT_COLORS[value],
}));

export function paymentPartsLabel(count: number) {
  const n = Math.max(1, Math.floor(count) || 1);
  if (n <= 1) return 'Одразу';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} частина`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} частини`;
  return `${n} частин`;
}

export const DURATION_OPTIONS = [
  { value: '1', label: '1 місяць' },
  { value: '3', label: '3 місяці' },
  { value: '6', label: '6 місяців' },
  { value: '12', label: '12 місяців' },
] as const;

export function durationLabel(months: number) {
  const match = DURATION_OPTIONS.find((item) => item.value === String(months));
  return match?.label ?? `${months} міс.`;
}
