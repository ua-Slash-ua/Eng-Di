export type UserPanelRole = 'student' | 'teacher';

export type User = {
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
  isActivated?: boolean;
  adminRole: { id: number; name: string; slug: string } | null;
  permissions: string[];
  createdAt: string;
};

export function canAccessUserPanel(user: User | null | undefined): user is User & { userRole: UserPanelRole } {
  return user?.userRole === 'student' || user?.userRole === 'teacher';
}

export function cabinetBasePath(userRole: UserPanelRole | null) {
  if (userRole === 'teacher') return '/cabinet/teacher';
  if (userRole === 'student') return '/cabinet/student';
  return '/login';
}
