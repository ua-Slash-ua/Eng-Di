export type BlockListItem = {
  id: number;
  type: string;
  name: string;
  plaque: string;
  updatedAt: string;
};

export type BlockItem = {
  id: number;
  type: string;
  name: string;
  plaque: string;
  title: string;
  meta: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type BlockUsage = {
  id: number;
  name: string;
  type: string;
};

export type AboutStatOption = {
  id: number;
  value: string;
  label: string;
  icon: string | null;
};

export type TariffOption = {
  id: number;
  title: string;
  lessons: number;
  price: number;
  popular: boolean;
  icon: string | null;
  variant: string;
};

export type RuleOption = {
  id: number;
  title: string;
  description: string;
  accent: number;
};

export type ReviewOption = {
  id: number;
  quote: string;
  author: string;
  result: string;
  rating: number;
  kind: 'manual' | 'user';
  isVerified: boolean;
};

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  hero: 'Герой',
  about: 'Про школу',
  levels: 'Прогрес / рівні',
  formats: 'Формати',
  pricing: 'Пакети занять',
  rules: 'Правила',
  reviews: 'Відгуки',
  cta: 'Заклик до дії',
  lead: 'Форма заявки',
};

export const BLOCK_TYPE_OPTIONS = [
  { value: 'hero', label: 'Герой' },
  { value: 'about', label: 'Про школу' },
  { value: 'levels', label: 'Прогрес / рівні' },
  { value: 'formats', label: 'Формати' },
  { value: 'pricing', label: 'Пакети занять' },
  { value: 'rules', label: 'Правила' },
  { value: 'reviews', label: 'Відгуки' },
  { value: 'cta', label: 'Заклик до дії' },
  { value: 'lead', label: 'Форма заявки' },
];

export type BlockType =
  | 'hero'
  | 'about'
  | 'levels'
  | 'formats'
  | 'pricing'
  | 'rules'
  | 'reviews'
  | 'cta'
  | 'lead';

export function asBlockType(value: string): BlockType {
  if (
    value === 'about' ||
    value === 'levels' ||
    value === 'formats' ||
    value === 'pricing' ||
    value === 'rules' ||
    value === 'reviews' ||
    value === 'cta' ||
    value === 'lead'
  ) {
    return value;
  }
  return 'hero';
}

export type LevelItem = {
  code: string;
  title: string;
  description: string;
};

export function createLevel(): LevelItem {
  return { code: '', title: '', description: '' };
}

export function emptyLevels(): LevelItem[] {
  return [];
}

export function parseLevels(value?: string): LevelItem[] {
  try {
    const parsed = JSON.parse(value ?? '') as unknown;
    if (!Array.isArray(parsed)) return emptyLevels();
    return parsed.map((entry) => {
      const item = entry as Partial<LevelItem> | undefined;
      return {
        code: String(item?.code ?? ''),
        title: String(item?.title ?? ''),
        description: String(item?.description ?? ''),
      };
    });
  } catch {
    return emptyLevels();
  }
}

export type FormatCardItem = {
  icon: string;
  title: string;
  description: string;
  accent: string;
};

export const FORMAT_ACCENT_OPTIONS = [
  { value: '1', label: 'Рожевий', swatch: '#ff6fa5' },
  { value: '2', label: 'Бузковий', swatch: '#8b6ff0' },
  { value: '3', label: 'Мʼятний', swatch: '#3fd8b5' },
];

export function createFormatCard(): FormatCardItem {
  return { icon: '', title: '', description: '', accent: '1' };
}

export function emptyFormatCards(): FormatCardItem[] {
  return [];
}

export function parseFormatCards(value?: string): FormatCardItem[] {
  try {
    const parsed = JSON.parse(value ?? '') as unknown;
    if (!Array.isArray(parsed)) return emptyFormatCards();
    return parsed.map((entry) => {
      const item = entry as Partial<FormatCardItem> & { accent?: string | number };
      const accent = String(item?.accent ?? '1');
      return {
        icon: String(item?.icon ?? ''),
        title: String(item?.title ?? ''),
        description: String(item?.description ?? ''),
        accent: accent === '2' || accent === '3' ? accent : '1',
      };
    });
  } catch {
    return emptyFormatCards();
  }
}

export function parseStatIds(value?: string): number[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => Number(item)).filter((id) => Number.isInteger(id) && id > 0);
    }
  } catch {
    /* ignore */
  }
  return [];
}
