import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type { TariffItem, TariffListItem } from './types';

export const tariffsApi = {
  list: (query: ListParams = {}) =>
    api<Paginated<TariffListItem>>(`/api/admin/tariffs${listQuery(query)}`),
  get: (id: string | number) => api<TariffItem>(`/api/admin/tariffs/${id}`),
  create: (body: unknown) => api<TariffItem>('/api/admin/tariffs', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string | number, body: unknown) =>
    api<TariffItem>(`/api/admin/tariffs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/tariffs/${id}`, { method: 'DELETE' }),
};
