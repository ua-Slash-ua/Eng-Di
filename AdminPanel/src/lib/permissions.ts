export type UserPanelRole = 'student' | 'teacher';

export type PublicAdminRole = {
  id: number;
  name: string;
  slug: string;
};

export type User = {
  id: number;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  birthDate: string | null;
  phone: string | null;
  userRole: UserPanelRole | null;
  isSuperAdmin: boolean;
  status: 'active' | 'blocked';
  isActivated: boolean;
  pendingPassword?: string | null;
  pendingExpiresAt?: string | null;
  adminRole: PublicAdminRole | null;
  permissions: string[];
  createdAt: string;
};

export function hasPermission(user: User | null | undefined, key: string) {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return user.permissions.includes(key);
}

export function canAccessAdminPanel(user: User | null | undefined) {
  return Boolean(user?.isSuperAdmin || user?.adminRole);
}

export function formatUserAccess(user: User | null | undefined) {
  if (!user) return '—';
  const parts: string[] = [];
  if (user.userRole === 'student') parts.push('Учень');
  if (user.userRole === 'teacher') parts.push('Вчитель');
  if (user.isSuperAdmin) parts.push('Супер-адмін');
  else if (user.adminRole?.name) parts.push(user.adminRole.name);
  return parts.join(', ') || '—';
}
