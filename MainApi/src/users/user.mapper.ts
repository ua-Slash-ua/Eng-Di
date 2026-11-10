import type { User } from '@prisma/client';
import { ALL_PERMISSION_KEYS } from '../auth/permissions.catalog';
import type { AdminUser, PublicUser } from './user.types';

type UserWithRole = User & {
  adminRole?: {
    id: number;
    name: string;
    slug: string;
    permissions: { permission: { key: string } }[];
  } | null;
};

export function resolveUserPermissions(user: UserWithRole): string[] {
  if (user.isSuperAdmin) {
    return ALL_PERMISSION_KEYS;
  }
  if (!user.adminRole) {
    return [];
  }
  return user.adminRole.permissions.map((row) => row.permission.key);
}

export function toPublicUser(user: UserWithRole): PublicUser {
  const adminRole = user.adminRole
    ? { id: user.adminRole.id, name: user.adminRole.name, slug: user.adminRole.slug }
    : null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    userRole: user.userRole,
    isSuperAdmin: user.isSuperAdmin,
    status: user.status,
    isActivated: user.activatedAt != null,
    adminRole,
    permissions: resolveUserPermissions(user),
    createdAt: user.createdAt.toISOString(),
  };
}

export function toAdminUser(user: UserWithRole, pendingTtlMs: number): AdminUser {
  const publicUser = toPublicUser(user);
  if (publicUser.isActivated || !user.pendingPassword) {
    return { ...publicUser, pendingPassword: null, pendingExpiresAt: null };
  }
  const pendingExpiresAt = new Date(user.createdAt.getTime() + pendingTtlMs);
  if (pendingExpiresAt.getTime() <= Date.now()) {
    return { ...publicUser, pendingPassword: null, pendingExpiresAt: null };
  }
  return {
    ...publicUser,
    pendingPassword: user.pendingPassword,
    pendingExpiresAt: pendingExpiresAt.toISOString(),
  };
}
