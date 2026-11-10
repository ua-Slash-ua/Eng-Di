import { API_URL } from './page';
import { ICONS } from './svgIcon';

export type AboutStat = {
  id: number;
  value: string;
  label: string;
  icon: string | null;
  sortOrder: number;
  category: { id: number; slug: string; title: string };
};

const FALLBACK: AboutStat[] = [
  { id: 1, value: '7 років', label: 'досвіду викладання', icon: ICONS.cap, sortOrder: 1, category: { id: 1, slug: 'hero', title: 'Герой' } },
  { id: 2, value: '120+', label: 'учнів заговорили', icon: ICONS.smile, sortOrder: 2, category: { id: 1, slug: 'hero', title: 'Герой' } },
  { id: 3, value: '4.9/5', label: 'середня оцінка', icon: ICONS.star, sortOrder: 3, category: { id: 1, slug: 'hero', title: 'Герой' } },
  { id: 4, value: '500+', label: 'проведених занять', icon: null, sortOrder: 1, category: { id: 2, slug: 'about', title: 'Про школу' } },
  { id: 5, value: 'CELTA', label: 'міжнародний сертифікат', icon: null, sortOrder: 2, category: { id: 2, slug: 'about', title: 'Про школу' } },
  { id: 6, value: 'A1–C2', label: 'усі рівні', icon: null, sortOrder: 3, category: { id: 2, slug: 'about', title: 'Про школу' } },
];

export async function fetchAboutStats(): Promise<AboutStat[]> {
  try {
    const response = await fetch(`${API_URL}/api/about-stats`, { cache: 'no-store' });
    if (!response.ok) {
      return FALLBACK;
    }
    const items = (await response.json()) as AboutStat[];
    return items.length ? items : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function statsByCategory(items: AboutStat[], slug: string) {
  return items.filter((item) => item.category.slug === slug);
}
