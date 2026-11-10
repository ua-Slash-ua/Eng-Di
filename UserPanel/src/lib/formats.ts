import { API_URL } from './page';
import { ICONS } from './svgIcon';

export type Format = {
  id: number;
  title: string;
  description: string;
  icon: string | null;
  accent: number;
  sortOrder: number;
};

const FALLBACK: Format[] = [
  {
    id: 1,
    title: 'Розмовна практика',
    description: 'Знімаємо страх говорити: живі теми, імпровізація, виправлення помилок одразу.',
    icon: ICONS.chat,
    accent: 1,
    sortOrder: 1,
  },
  {
    id: 2,
    title: 'Граматика й база',
    description: 'Системно закриваємо прогалини — від часів дієслова до складних конструкцій.',
    icon: ICONS.layers,
    accent: 2,
    sortOrder: 2,
  },
  {
    id: 3,
    title: 'Підготовка до іспитів',
    description: 'IELTS, Cambridge, співбесіда на роботу — з конкретним дедлайном і планом.',
    icon: ICONS.target,
    accent: 3,
    sortOrder: 3,
  },
];

export async function fetchFormats(): Promise<Format[]> {
  try {
    const response = await fetch(`${API_URL}/api/formats`, { cache: 'no-store' });
    if (!response.ok) {
      return FALLBACK;
    }
    const items = (await response.json()) as Format[];
    return items.length ? items : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function formatAccentClass(accent: number) {
  const n = accent === 2 || accent === 3 ? accent : 1;
  return `fi-${n}`;
}
