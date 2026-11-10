import { fetchAboutStats, statsByCategory } from '@/lib/about-stats';
import type { SiteBlock } from '@/lib/blocks';
import { fetchFormats } from '@/lib/formats';
import { API_URL } from '@/lib/page';
import { fetchReviews } from '@/lib/reviews';
import { fetchRules } from '@/lib/rules';
import { fetchTariffs } from '@/lib/tariffs';

export type HomeSection = {
  id: number;
  sortOrder: number;
  block: SiteBlock;
};

async function fetchHomeSections(): Promise<HomeSection[]> {
  try {
    const response = await fetch(`${API_URL}/api/pages/home`, { cache: 'no-store' });
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as { sections?: HomeSection[] };
    return Array.isArray(data.sections) ? data.sections : [];
  } catch {
    return [];
  }
}

export async function loadHomePage() {
  const [stats, formats, tariffs, rules, reviews, sections] = await Promise.all([
    fetchAboutStats(),
    fetchFormats(),
    fetchTariffs(),
    fetchRules(),
    fetchReviews(),
    fetchHomeSections(),
  ]);

  return {
    aboutStats: statsByCategory(stats, 'about'),
    formats,
    tariffs,
    rules,
    reviews,
    sections,
  };
}

export type HomePageData = Awaited<ReturnType<typeof loadHomePage>>;
