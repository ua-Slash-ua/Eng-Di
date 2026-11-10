import { API_URL } from './page';

export type SchoolRule = {
  id: number;
  title: string;
  description: string;
  accent: number;
  sortOrder: number;
};

const FALLBACK: SchoolRule[] = [
  {
    id: 1,
    title: 'Оплата наперед за обраний пакет',
    description: '4 / 8 / 12 занять на місяць, оплата з 1 по 5 число включно.',
    accent: 1,
    sortOrder: 1,
  },
  {
    id: 2,
    title: 'Один платіж за весь пакет',
    description: 'Не поурочно — так простіше планувати заняття наперед.',
    accent: 2,
    sortOrder: 2,
  },
  {
    id: 3,
    title: 'Попереджай про відсутність заздалегідь',
    description: 'Тоді заняття можна перенести протягом місяця в зручний час.',
    accent: 3,
    sortOrder: 3,
  },
  {
    id: 4,
    title: 'Пропуск без попередження',
    description: 'На жаль, таке заняття згорає — це чесно і для школи, і для тебе.',
    accent: 4,
    sortOrder: 4,
  },
  {
    id: 5,
    title: 'Хвороба чи форс-мажор',
    description: 'За домовленістю заняття заморожується або переноситься без втрат.',
    accent: 5,
    sortOrder: 5,
  },
];

export async function fetchRules(): Promise<SchoolRule[]> {
  try {
    const response = await fetch(`${API_URL}/api/rules`, { cache: 'no-store' });
    if (!response.ok) {
      return FALLBACK;
    }
    const items = (await response.json()) as SchoolRule[];
    return items.length ? items : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function ruleAccentClass(accent: number) {
  const n = accent >= 1 && accent <= 5 ? accent : 1;
  return `rn-${n}`;
}
