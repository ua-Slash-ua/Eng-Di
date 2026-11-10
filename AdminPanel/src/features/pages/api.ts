import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type { BlockCatalogItem, PageItem, PageRow, PageSeo } from './types';

export const pagesApi = {
  list: (query: ListParams = {}): Promise<Paginated<PageRow>> =>
    api<Paginated<PageRow>>(`/api/admin/pages${listQuery(query)}`),
  get: (id: string | number) => api<PageItem>(`/api/admin/pages/${id}`),
  create: (body: { title: string; slug: string }) =>
    api<{ id: number }>('/api/admin/pages', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: string | number,
    body: { title: string; slug: string; seo: { title: string; description: string; keywords: string } },
  ) => api<PageItem>(`/api/admin/pages/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/pages/${id}`, { method: 'DELETE' }),
  attachSection: (pageId: string | number, blockId: number) =>
    api<PageItem>(`/api/admin/pages/${pageId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ blockId }),
    }),
  reorderSections: (pageId: string | number, sectionIds: number[]) =>
    api<PageItem>(`/api/admin/pages/${pageId}/sections/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ sectionIds }),
    }),
  detachSection: (sectionId: number) =>
    api<PageItem>(`/api/admin/page-sections/${sectionId}`, { method: 'DELETE' }),
  blocksCatalog: () => api<BlockCatalogItem[]>('/api/admin/blocks/catalog'),
};

export type { PageSeo };
