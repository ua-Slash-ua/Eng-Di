import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type { FaqItem } from './types';

export const faqsApi = {
  list: (query: ListParams = {}) => api<Paginated<FaqItem>>(`/api/admin/faqs${listQuery(query)}`),
  get: (id: string | number) => api<FaqItem>(`/api/admin/faqs/${id}`),
  create: (body: { question: string; answer: string }) =>
    api<FaqItem>('/api/admin/faqs', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string | number, body: unknown) =>
    api<FaqItem>(`/api/admin/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/faqs/${id}`, { method: 'DELETE' }),
};
