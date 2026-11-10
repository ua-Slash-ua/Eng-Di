import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';
import type {
  AuthEvent,
  AuthSession,
  AuthOverview,
  AuthSummary,
  CreateUserResponse,
  User,
  UserAuthResponse,
  UserBrief,
  UserClassResponse,
  UserLessonsResponse,
  UserResponse,
  UserPanelRole,
  UserTariffsResponse,
} from './types';

type UsersApiListResponse = {
  users: User[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

function mapListQuery(query: Record<string, string | number | undefined> = {}) {
  const next = { ...query };
  if (next.role) {
    const roles = String(next.role).split(',').filter(Boolean);
    const userRoles = roles.filter((value) => value === 'student' || value === 'teacher');
    const adminAccess = roles.filter((value) => value === 'super_admin' || value === 'admin');
    delete next.role;
    if (userRoles.length) next.userRole = userRoles.join(',');
    if (adminAccess.length) next.adminAccess = adminAccess.join(',');
  }
  return next;
}

export const usersApi = {
  list: async (query: ListParams = {}): Promise<Paginated<User>> => {
    const data = await api<UsersApiListResponse>(
      `/api/admin/users${listQuery(mapListQuery(query as Record<string, string | number | undefined>))}`,
    );
    return {
      items: data.users,
      total: data.total,
      page: data.page,
      limit: data.limit,
      pageCount: data.pages,
    };
  },
  get: (id: string | number) => api<UserResponse>(`/api/admin/users/${id}`),
  auth: (id: string | number) => api<UserAuthResponse>(`/api/admin/users/${id}/auth`),
  create: (body: {
    email: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    birthDate?: string | null;
    name?: string;
    userRole?: UserPanelRole | '';
    isSuperAdmin?: boolean;
    adminRoleId?: number;
  }) => api<CreateUserResponse>('/api/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: string | number,
    body: {
      name?: string;
      firstName: string;
      lastName: string;
      middleName: string;
      birthDate: string | null;
      email: string;
      phone: string;
      userRole?: UserPanelRole | null;
      isSuperAdmin?: boolean;
      adminRoleId?: number | null;
    },
  ) => api<UserResponse>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  logout: (id: string | number) => api<{ ok: boolean }>(`/api/admin/users/${id}/logout`, { method: 'POST' }),
  block: (id: string | number) => api<UserResponse>(`/api/admin/users/${id}/block`, { method: 'POST' }),
  unblock: (id: string | number) => api<UserResponse>(`/api/admin/users/${id}/unblock`, { method: 'POST' }),
  resetPassword: (id: string | number) =>
    api<CreateUserResponse>(`/api/admin/users/${id}/reset-password`, { method: 'POST' }),
  remove: (id: string | number) => api<{ ok: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  tariffs: (id: string | number) => api<UserTariffsResponse>(`/api/admin/users/${id}/tariffs`),
  lessons: (id: string | number) => api<UserLessonsResponse>(`/api/admin/users/${id}/lessons`),
  refundLesson: (userId: string | number, lessonId: number) =>
    api<UserLessonsResponse>(`/api/admin/users/${userId}/lessons/${lessonId}/refund`, { method: 'POST' }),
  completeLesson: (userId: string | number, lessonId: number) =>
    api<UserLessonsResponse>(`/api/admin/users/${userId}/lessons/${lessonId}/complete`, { method: 'POST' }),
  skipLesson: (userId: string | number, lessonId: number) =>
    api<UserLessonsResponse>(`/api/admin/users/${userId}/lessons/${lessonId}/skip`, { method: 'POST' }),
  setTariffPayments: (userId: string | number, subId: number, paidCount: number) =>
    api<UserTariffsResponse>(`/api/admin/users/${userId}/tariffs/${subId}/payments`, {
      method: 'PATCH',
      body: JSON.stringify({ paidCount }),
    }),
  directory: (userRole: UserPanelRole) =>
    api<{ users: UserBrief[] }>(`/api/admin/users/directory?userRole=${userRole}`),
  classOf: (id: string | number) => api<UserClassResponse>(`/api/admin/users/${id}/class`),
  setTeacher: (id: string | number, teacherId: number | null) =>
    api<UserClassResponse>(`/api/admin/users/${id}/teacher`, {
      method: 'PATCH',
      body: JSON.stringify({ teacherId }),
    }),
  addStudent: (id: string | number, studentId: number) =>
    api<UserClassResponse>(`/api/admin/users/${id}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
  removeStudent: (id: string | number, studentId: number) =>
    api<UserClassResponse>(`/api/admin/users/${id}/students/${studentId}`, { method: 'DELETE' }),
};

export const authAdminApi = {
  summary: () => api<AuthSummary>('/api/admin/auth/summary'),
  overview: () => api<AuthOverview>('/api/admin/auth/overview'),
  events: async (query: ListParams = {}): Promise<Paginated<AuthEvent>> => {
    const data = await api<{
      events: AuthEvent[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>(`/api/admin/auth/events${listQuery(query)}`);
    return {
      items: data.events,
      total: data.total,
      page: data.page,
      limit: data.limit,
      pageCount: data.pages,
    };
  },
  sessions: async (query: ListParams = {}): Promise<Paginated<AuthSession>> => {
    const data = await api<{
      sessions: AuthSession[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>(`/api/admin/auth/sessions${listQuery(query)}`);
    return {
      items: data.sessions,
      total: data.total,
      page: data.page,
      limit: data.limit,
      pageCount: data.pages,
    };
  },
  logoutAll: () => api<{ ok: boolean }>('/api/admin/auth/logout-all', { method: 'POST' }),
  unblockAll: () => api<{ ok: boolean; count: number }>('/api/admin/auth/unblock-all', { method: 'POST' }),
  revokeSession: (id: string | number) =>
    api<{ ok: boolean }>(`/api/admin/sessions/${id}/revoke`, { method: 'POST' }),
};
