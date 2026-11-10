import type { CSSProperties } from 'react';
import { API_URL } from './page';
import type { Review } from './reviews';
import type { SchoolRule } from './rules';
import { ICONS } from './svgIcon';
import type { Tariff } from './tariffs';

export type BlockStat = {
  id: number;
  value: string;
  label: string;
  icon: string | null;
};

export type SiteBlock = {
  id: number;
  type: string;
  name: string;
  plaque: string;
  title: string;
  meta: Record<string, string>;
  stats?: BlockStat[];
  tariffs?: Tariff[];
  rules?: SchoolRule[];
  reviews?: Review[];
};

const HERO_FALLBACK: SiteBlock = {
  id: 0,
  type: 'hero',
  name: 'Герой головної',
  plaque: "👋 Let's learn!",
  title: 'Заговори англійською<br><span class="u1">без</span> <span class="script">страху й зубріння</span>',
  meta: {
    description: 'Індивідуальні онлайн-заняття з викладачем, який підлаштовується під твій темп, а не навпаки.',
    button1_label: 'Обрати пакет занять',
    button1_href: '#pricing',
    button2_label: 'Познайомитись',
    button2_href: '#about',
    photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    overlay_circle: 'GB',
    overlay_badge_value: 'C2',
    overlay_badge_label: 'рівень носія',
  },
  stats: [
    { id: 1, value: '7 років', label: 'досвіду викладання', icon: ICONS.cap },
    { id: 2, value: '120+', label: 'учнів заговорили', icon: ICONS.smile },
    { id: 3, value: '4.9/5', label: 'середня оцінка', icon: ICONS.star },
  ],
};

const PRICING_FALLBACK: SiteBlock = {
  id: 0,
  type: 'pricing',
  name: 'Пакети — головна',
  plaque: 'Пакети занять',
  title: 'Більше уроків — більше можливостей!',
  meta: {
    description: 'Оплата одним платежем за весь пакет — без переплати поурочно.',
    tariff_ids: '[]',
  },
  tariffs: [],
};

export async function fetchHeroBlock(): Promise<SiteBlock> {
  try {
    const response = await fetch(`${API_URL}/api/blocks?type=hero`, { cache: 'no-store' });
    if (!response.ok) {
      return HERO_FALLBACK;
    }
    const items = (await response.json()) as SiteBlock[];
    return items[0] ?? HERO_FALLBACK;
  } catch {
    return HERO_FALLBACK;
  }
}

export async function fetchPricingBlock(): Promise<SiteBlock> {
  try {
    const response = await fetch(`${API_URL}/api/blocks?type=pricing`, { cache: 'no-store' });
    if (!response.ok) {
      return PRICING_FALLBACK;
    }
    const items = (await response.json()) as SiteBlock[];
    return items[0] ?? PRICING_FALLBACK;
  } catch {
    return PRICING_FALLBACK;
  }
}

const RULES_FALLBACK: SiteBlock = {
  id: 0,
  type: 'rules',
  name: 'Правила — головна',
  plaque: 'Правила',
  title: 'Щоб заняття були зручними для нас обох',
  meta: {
    description: 'Коротко про оплату, пропуски й перенесення',
    rule_ids: '[]',
  },
  rules: [],
};

export async function fetchRulesBlock(): Promise<SiteBlock> {
  try {
    const response = await fetch(`${API_URL}/api/blocks?type=rules`, { cache: 'no-store' });
    if (!response.ok) {
      return RULES_FALLBACK;
    }
    const items = (await response.json()) as SiteBlock[];
    return items[0] ?? RULES_FALLBACK;
  } catch {
    return RULES_FALLBACK;
  }
}

const REVIEWS_FALLBACK: SiteBlock = {
  id: 0,
  type: 'reviews',
  name: 'Відгуки — головна',
  plaque: 'Відгуки',
  title: 'Що кажуть наші учні',
  meta: {
    review_ids: '[]',
  },
  reviews: [],
};

export async function fetchReviewsBlock(): Promise<SiteBlock> {
  try {
    const response = await fetch(`${API_URL}/api/blocks?type=reviews`, { cache: 'no-store' });
    if (!response.ok) {
      return REVIEWS_FALLBACK;
    }
    const items = (await response.json()) as SiteBlock[];
    return items[0] ?? REVIEWS_FALLBACK;
  } catch {
    return REVIEWS_FALLBACK;
  }
}

const CTA_FALLBACK: SiteBlock = {
  id: 0,
  type: 'cta',
  name: 'CTA — головна',
  plaque: '',
  title: 'Перше заняття — знайомче й безкоштовне',
  meta: {
    description: 'Визначимо твій рівень, мету і складемо план навчання за 30 хвилин.',
    button_label: 'Залишити заявку',
    button_href: '#lead-form',
  },
};

export async function fetchCtaBlock(): Promise<SiteBlock> {
  try {
    const response = await fetch(`${API_URL}/api/blocks?type=cta`, { cache: 'no-store' });
    if (!response.ok) {
      return CTA_FALLBACK;
    }
    const items = (await response.json()) as SiteBlock[];
    return items[0] ?? CTA_FALLBACK;
  } catch {
    return CTA_FALLBACK;
  }
}

const LEAD_FALLBACK: SiteBlock = {
  id: 0,
  type: 'lead',
  name: 'Заявка — головна',
  plaque: 'Заявка',
  title: 'Записатись на навчання',
  meta: {
    description: 'Залиште контакти — ми напишемо і підкажемо, з якого рівня почати.',
    button_label: 'Надіслати заявку',
  },
};

export async function fetchLeadBlock(): Promise<SiteBlock> {
  try {
    const response = await fetch(`${API_URL}/api/blocks?type=lead`, { cache: 'no-store' });
    if (!response.ok) {
      return LEAD_FALLBACK;
    }
    const items = (await response.json()) as SiteBlock[];
    return items[0] ?? LEAD_FALLBACK;
  } catch {
    return LEAD_FALLBACK;
  }
}

export function photoStyle(url?: string, cssVar = '--hero-photo'): CSSProperties | undefined {
  if (!url) {
    return undefined;
  }
  const safe = url.replace(/"/g, '');
  if (!/^https?:\/\//i.test(safe) && !safe.startsWith('/')) {
    return undefined;
  }
  return { [cssVar]: `url("${safe}")` } as CSSProperties;
}
