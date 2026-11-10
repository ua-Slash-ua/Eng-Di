import type { UserPanelRole } from '@prisma/client';

export type { UserPanelRole };

export type PublicAdminRole = {
  id: number;
  name: string;
  slug: string;
};

export type PublicUser = {
  id: number;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  birthDate: string | null;
  phone: string | null;
  avatarUrl: string | null;
  userRole: UserPanelRole | null;
  isSuperAdmin: boolean;
  status: 'active' | 'blocked';
  isActivated: boolean;
  adminRole: PublicAdminRole | null;
  permissions: string[];
  createdAt: string;
};

export type AdminUser = PublicUser & {
  pendingPassword: string | null;
  pendingExpiresAt: string | null;
};

export type AuthUser = PublicUser & {
  sessionId: number;
};

export function hasAdminPanelAccess(user: {
  isSuperAdmin: boolean;
  adminRoleId?: number | null;
  adminRole?: unknown | null;
}) {
  return user.isSuperAdmin || Boolean(user.adminRoleId ?? user.adminRole);
}

export function hasUserPanelAccess(user: { userRole: UserPanelRole | null }) {
  return user.userRole === 'student' || user.userRole === 'teacher';
}

export const authUserSummarySelect = {
  id: true,
  email: true,
  name: true,
  userRole: true,
  isSuperAdmin: true,
  adminRole: { select: { name: true } },
} as const;

export function formatAccessSummary(user: {
  userRole: UserPanelRole | null;
  isSuperAdmin: boolean;
  adminRole?: { name: string } | null;
}) {
  const parts: string[] = [];
  if (user.userRole === 'student') parts.push('Учень');
  if (user.userRole === 'teacher') parts.push('Вчитель');
  if (user.isSuperAdmin) parts.push('Супер-адмін');
  else if (user.adminRole?.name) parts.push(user.adminRole.name);
  return parts.join(', ') || '—';
}
