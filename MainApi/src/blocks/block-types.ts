export const BLOCK_TYPES = [
  'hero',
  'about',
  'levels',
  'formats',
  'pricing',
  'rules',
  'reviews',
  'cta',
  'lead',
] as const;

export type BlockTypeSlug = (typeof BLOCK_TYPES)[number];

export const BLOCK_TYPE_LABELS: Record<BlockTypeSlug, string> = {
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

export const HERO_PLAQUE_DEFAULT = "👋 Let's learn!";

export const HERO_TITLE_DEFAULT =
  'Заговори англійською<br><span class="u1">без</span> <span class="script">страху й зубріння</span>';

export const HERO_META_DEFAULTS: Record<string, string> = {
  description: 'Індивідуальні онлайн-заняття з викладачем, який підлаштовується під твій темп, а не навпаки.',
  button1_label: 'Обрати пакет занять',
  button1_href: '#pricing',
  button2_label: 'Познайомитись',
  button2_href: '#about',
  photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
  overlay_circle: 'GB',
  overlay_badge_value: 'C2',
  overlay_badge_label: 'рівень носія',
  stat_ids: '[]',
};

export const PRICING_PLAQUE_DEFAULT = 'Пакети занять';
export const PRICING_TITLE_DEFAULT = 'Більше уроків — більше можливостей!';
export const PRICING_META_DEFAULTS: Record<string, string> = {
  description: 'Оплата одним платежем за весь пакет — без переплати поурочно.',
  tariff_ids: '[]',
};

export const RULES_PLAQUE_DEFAULT = 'Правила';
export const RULES_TITLE_DEFAULT = 'Щоб заняття були зручними для нас обох';
export const RULES_META_DEFAULTS: Record<string, string> = {
  description: 'Коротко про оплату, пропуски й перенесення',
  rule_ids: '[]',
};

export const REVIEWS_PLAQUE_DEFAULT = 'Відгуки';
export const REVIEWS_TITLE_DEFAULT = 'Що кажуть наші учні';
export const REVIEWS_META_DEFAULTS: Record<string, string> = {
  review_ids: '[]',
};

export const CTA_TITLE_DEFAULT = 'Перше заняття — знайомче й безкоштовне';
export const CTA_META_DEFAULTS: Record<string, string> = {
  description: 'Визначимо твій рівень, мету і складемо план навчання за 30 хвилин.',
  button_label: 'Залишити заявку',
  button_href: '#lead-form',
};

export const LEAD_PLAQUE_DEFAULT = 'Заявка';
export const LEAD_TITLE_DEFAULT = 'Записатись на навчання';
export const LEAD_META_DEFAULTS: Record<string, string> = {
  description: 'Залиште контакти — ми напишемо і підкажемо, з якого рівня почати.',
  button_label: 'Надіслати заявку',
};

export const BLOCK_META_KEYS: Record<BlockTypeSlug, string[]> = {
  hero: Object.keys(HERO_META_DEFAULTS),
  about: ['accent_text', 'body', 'photo_url', 'photo_placeholder', 'stat_ids'],
  levels: ['description', 'levels'],
  formats: ['description', 'formats'],
  pricing: ['description', 'tariff_ids'],
  rules: ['description', 'rule_ids'],
  reviews: ['review_ids'],
  cta: ['description', 'button_label', 'button_href'],
  lead: ['description', 'button_label'],
};

export function isBlockType(value: string): value is BlockTypeSlug {
  return (BLOCK_TYPES as readonly string[]).includes(value);
}
