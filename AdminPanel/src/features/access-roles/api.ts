import { api } from '@/lib/api';

export type PermissionItem = {
  key: string;
  resource: string;
  action: string;
  label: string;
  groupLabel: string;
};

export type AdminRoleItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissionKeys: string[];
};

export const accessRolesApi = {
  permissions: () => api<{ groups: { groupLabel: string; permissions: PermissionItem[] }[] }>('/api/admin/permissions'),
  list: () => api<{ roles: AdminRoleItem[] }>('/api/admin/admin-roles'),
  get: (id: number | string) => api<{ role: AdminRoleItem }>(`/api/admin/admin-roles/${id}`),
  create: (body: { name: string; description?: string; permissionKeys: string[] }) =>
    api<{ role: AdminRoleItem }>('/api/admin/admin-roles', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number | string, body: { name?: string; description?: string | null; permissionKeys?: string[] }) =>
    api<{ role: AdminRoleItem }>(`/api/admin/admin-roles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number | string) => api<{ ok: boolean }>(`/api/admin/admin-roles/${id}`, { method: 'DELETE' }),
};
