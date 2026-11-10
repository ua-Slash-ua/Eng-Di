export type PageSeo = {
  title: string | null;
  description: string | null;
  keywords: string | null;
};

export type PageRow = {
  id: number;
  slug: string;
  title: string;
  seo: PageSeo | null;
  createdAt: string;
  _count?: { sections: number; blocks?: number };
};

export type PageSectionBlock = {
  id: number;
  type: string;
  name: string;
  plaque: string | null;
  updatedAt: string;
};

export type PageSection = {
  id: number;
  sortOrder: number;
  block: PageSectionBlock;
};

export type PageItem = {
  id: number;
  slug: string;
  title: string;
  seo: PageSeo | null;
  createdAt: string;
  sections?: PageSection[];
  _count?: { sections: number };
};

export type BlockCatalogItem = {
  id: number;
  type: string;
  name: string;
  plaque: string | null;
};

export function seoReady(item: Pick<PageRow, 'seo'>): boolean {
  return Boolean(item.seo?.title && item.seo?.description);
}

export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}
