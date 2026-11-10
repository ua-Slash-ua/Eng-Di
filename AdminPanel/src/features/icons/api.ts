import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type { IconCatalogItem, IconGroupItem, IconItem, IconListItem, UploadMetaItem } from './types';

export const iconsApi = {
  list: (query: ListParams = {}) => api<Paginated<IconListItem>>(`/api/admin/icons${listQuery(query)}`),
  catalog: (opts: { groupId?: number; type?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.groupId) params.set('groupId', String(opts.groupId));
    if (opts.type) params.set('type', opts.type);
    const qs = params.toString();
    return api<IconCatalogItem[]>(`/api/admin/icons/catalog${qs ? `?${qs}` : ''}`);
  },
  get: (id: string | number) => api<IconItem>(`/api/admin/icons/${id}`),
  create: (body: {
    name: string;
    slug: string;
    svg?: string;
    url?: string;
    alt?: string;
    type?: string;
    groupId?: number | null;
  }) => api<IconItem>('/api/admin/icons', { method: 'POST', body: JSON.stringify(body) }),
  upload: (files: File[], meta: UploadMetaItem[] = [], groupId?: number | null) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    form.append('meta', JSON.stringify(meta));
    if (groupId != null) {
      form.append('groupId', String(groupId));
    }
    return api<IconItem[]>('/api/admin/icons/upload', { method: 'POST', body: form });
  },
  update: (id: string | number, body: unknown) =>
    api<IconItem>(`/api/admin/icons/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/icons/${id}`, { method: 'DELETE' }),
  removeMany: (ids: number[]) =>
    api<{ ok: boolean; deleted: number }>('/api/admin/icons/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

export const iconGroupsApi = {
  list: (type?: string) =>
    api<IconGroupItem[]>(`/api/admin/icon-groups${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  create: (body: { title: string; slug: string; type: string }) =>
    api<IconGroupItem>('/api/admin/icon-groups', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: unknown) =>
    api<IconGroupItem>(`/api/admin/icon-groups/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/admin/icon-groups/${id}`, { method: 'DELETE' }),
};
