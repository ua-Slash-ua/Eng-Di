import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type { FormatItem, FormatListItem } from './types';

export const formatsApi = {
  list: (query: ListParams = {}) =>
    api<Paginated<FormatListItem>>(`/api/admin/formats${listQuery(query)}`),
  get: (id: string | number) => api<FormatItem>(`/api/admin/formats/${id}`),
  create: (body: { title: string; description: string; icon?: string; accent: number }) =>
    api<FormatItem>('/api/admin/formats', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string | number, body: unknown) =>
    api<FormatItem>(`/api/admin/formats/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/formats/${id}`, { method: 'DELETE' }),
};
