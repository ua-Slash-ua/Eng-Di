import { API_URL } from '@/lib/page';

export type BlockType = 'HERO' | 'ABOUT' | 'TARIFFS' | 'RULES' | 'FORM';

export type PageBlock = {
  id: number;
  type: BlockType;
  sortOrder: number;
  content: Record<string, unknown>;
};

export type CmsPage = {
  id: number;
  slug: string;
  title: string;
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
  } | null;
  blocks: PageBlock[];
};

export async function fetchPage(slug: string): Promise<CmsPage | null> {
  const response = await fetch(`${API_URL}/api/pages/${slug}`, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  return response.json();
}
