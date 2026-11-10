import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type { RuleItem, RuleListItem } from './types';

export const rulesApi = {
  list: (query: ListParams = {}) =>
    api<Paginated<RuleListItem>>(`/api/admin/rules${listQuery(query)}`),
  get: (id: string | number) => api<RuleItem>(`/api/admin/rules/${id}`),
  create: (body: { title: string; description: string; accent: number }) =>
    api<RuleItem>('/api/admin/rules', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string | number, body: unknown) =>
    api<RuleItem>(`/api/admin/rules/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/rules/${id}`, { method: 'DELETE' }),
};
