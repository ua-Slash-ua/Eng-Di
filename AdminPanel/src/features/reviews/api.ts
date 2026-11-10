import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type { ReviewItem, ReviewListItem } from './types';

export const reviewsApi = {
  list: (query: ListParams = {}) =>
    api<Paginated<ReviewListItem>>(`/api/admin/reviews${listQuery(query)}`),
  get: (id: string | number) => api<ReviewItem>(`/api/admin/reviews/${id}`),
  create: (body: { quote: string; author: string; result: string; rating: number }) =>
    api<ReviewItem>('/api/admin/reviews', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string | number, body: unknown) =>
    api<ReviewItem>(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  verify: (id: string | number, isVerified: boolean) =>
    api<ReviewItem>(`/api/admin/reviews/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified }),
    }),
  remove: (id: number) => api(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
};
