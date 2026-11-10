import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type { AboutStatItem, AboutStatListItem, AboutStatUsage } from './types';

export const aboutStatsApi = {
  list: (query: ListParams & { category?: string } = {}) =>
    api<Paginated<AboutStatListItem>>(`/api/admin/about-stats${listQuery(query)}`),
  catalog: () => api<AboutStatListItem[]>('/api/admin/about-stats/catalog'),
  get: (id: string | number) => api<AboutStatItem>(`/api/admin/about-stats/${id}`),
  create: (body: { value: string; label: string; icon?: string }) =>
    api<AboutStatItem>('/api/admin/about-stats', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string | number, body: unknown) =>
    api<AboutStatItem>(`/api/admin/about-stats/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/about-stats/${id}`, { method: 'DELETE' }),
  usage: (id: string | number) => api<AboutStatUsage[]>(`/api/admin/about-stats/${id}/usage`),
};
