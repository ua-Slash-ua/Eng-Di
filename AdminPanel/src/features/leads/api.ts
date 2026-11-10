import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type { Lead, LeadCategory, LeadStatus } from './types';

export const leadsApi = {
  list: (query: ListParams = {}): Promise<Paginated<Lead>> =>
    api<Paginated<Lead>>(`/api/admin/leads${listQuery(query)}`),
  get: (id: string | number) => api<Lead>(`/api/admin/leads/${id}`),
  update: (id: string | number, body: { status: LeadStatus; categoryId?: number }) =>
    api<Lead>(`/api/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export const leadCategoriesApi = {
  list: () => api<LeadCategory[]>('/api/admin/lead-categories'),
  create: (body: { title: string; slug: string }) =>
    api<LeadCategory>('/api/admin/lead-categories', { method: 'POST', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/lead-categories/${id}`, { method: 'DELETE' }),
};
