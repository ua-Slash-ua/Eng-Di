import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type {
  AboutStatOption,
  BlockItem,
  BlockListItem,
  BlockUsage,
  ReviewOption,
  RuleOption,
  TariffOption,
} from './types';

export const blocksApi = {
  list: (query: ListParams & { type?: string } = {}) =>
    api<Paginated<BlockListItem>>(`/api/admin/blocks${listQuery(query)}`),
  get: (id: string | number) => api<BlockItem>(`/api/admin/blocks/${id}`),
  create: (body: { name: string; type: string }) =>
    api<BlockListItem>('/api/admin/blocks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string | number, body: unknown) =>
    api<BlockItem>(`/api/admin/blocks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/blocks/${id}`, { method: 'DELETE' }),
  usage: (id: string | number) => api<BlockUsage[]>(`/api/admin/blocks/${id}/usage`),
  statsCatalog: () => api<AboutStatOption[]>('/api/admin/about-stats/catalog'),
  tariffsCatalog: () => api<TariffOption[]>('/api/admin/tariffs/catalog'),
  rulesCatalog: () => api<RuleOption[]>('/api/admin/rules/catalog'),
  reviewsCatalog: () => api<ReviewOption[]>('/api/admin/reviews/catalog'),
};
