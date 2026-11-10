import { API_URL } from './page';
import { ICONS } from './svgIcon';

export type Tariff = {
  id: number;
  title: string;
  lessons: number;
  price: number;
  oldPrice: number | null;
  popular: boolean;
  note: string;
  variant: string;
  icon: string | null;
  installmentCount?: number;
  frozenLessonsPerMonth?: number;
  sortOrder: number;
};

const FALLBACK: Tariff[] = [
  {
    id: 1,
    title: '4 уроки',
    lessons: 4,
    price: 1920,
    oldPrice: null,
    popular: false,
    note: '✨ Чудовий старт',
    variant: 'start',
    icon: ICONS.book,
    installmentCount: 1,
    frozenLessonsPerMonth: 0,
    sortOrder: 1,
  },
  {
    id: 2,
    title: '8 уроків',
    lessons: 8,
    price: 3648,
    oldPrice: 3840,
    popular: true,
    note: '💗 Більше практики — кращий результат',
    variant: 'mid',
    icon: ICONS.book,
    installmentCount: 1,
    frozenLessonsPerMonth: 0,
    sortOrder: 2,
  },
  {
    id: 3,
    title: '12 уроків',
    lessons: 12,
    price: 5184,
    oldPrice: 5760,
    popular: false,
    note: '⭐ Найкраща ціна — найбільший прогрес',
    variant: 'pro',
    icon: ICONS.book,
    installmentCount: 1,
    frozenLessonsPerMonth: 0,
    sortOrder: 3,
  },
];

export async function fetchTariffs(): Promise<Tariff[]> {
  try {
    const response = await fetch(`${API_URL}/api/tariffs`, { cache: 'no-store' });
    if (!response.ok) {
      return FALLBACK;
    }
    const items = (await response.json()) as Tariff[];
    return items.length ? items : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function formatUah(amount: number): string {
  return amount.toLocaleString('uk-UA').replace(/[\u00A0\u202F]/g, ' ');
}

export function perLessonPrice(price: number, lessons: number) {
  if (!lessons) return 0;
  return Math.round(price / lessons);
}

export function discountPercent(price: number, oldPrice: number | null) {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}

export function ticketClass(variant: string) {
  if (variant === 'mid') return 'ticket mid';
  if (variant === 'pro') return 'ticket pro';
  return 'ticket';
}
