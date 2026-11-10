import { api } from '@/lib/api';
import type {
  TestAttemptQuotasPayload,
  TestAttemptReview,
  TestAttemptRow,
  TestItem,
  TestStats,
} from './types';

const base = '/api/admin/tests';

export type TestAccessGrant = {
  id: number;
  grantedAt: string;
  expiresAt: string | null;
  active: boolean;
  user: { id: number; name: string; email: string; userRole: string | null };
};

export const testsApi = {
  list: (kind?: string) => api<TestItem[]>(`${base}${kind ? `?kind=${kind}` : ''}`),
  get: (id: number) => api<TestItem>(`${base}/${id}`),
  create: (body: unknown) => api<TestItem>(base, { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: unknown) =>
    api<TestItem>(`${base}/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`${base}/${id}`, { method: 'DELETE' }),
  stats: (id: number) => api<TestStats>(`${base}/${id}/stats`),
  attempts: (id: number) => api<TestAttemptRow[]>(`${base}/${id}/attempts`),
  attemptDetail: (id: number, attemptId: number) =>
    api<TestAttemptReview>(`${base}/${id}/attempts/${attemptId}`),
  quotas: (id: number) => api<TestAttemptQuotasPayload>(`${base}/${id}/quotas`),
  setQuota: (id: number, userId: number, extraAttempts: number) =>
    api(`${base}/${id}/quotas`, {
      method: 'PATCH',
      body: JSON.stringify({ userId, extraAttempts }),
    }),
  grants: (id: number) => api<TestAccessGrant[]>(`${base}/${id}/grants`),
  grant: (id: number, userId: number) =>
    api<TestAccessGrant[]>(`${base}/${id}/grants`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  grantMany: (id: number, userIds: number[]) =>
    api<TestAccessGrant[]>(`${base}/${id}/grants`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    }),
  revokeGrant: (id: number, grantId: number) =>
    api<TestAccessGrant[]>(`${base}/${id}/grants/${grantId}`, { method: 'DELETE' }),
};
