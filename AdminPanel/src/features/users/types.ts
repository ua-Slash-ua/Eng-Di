export type UserPanelRole = 'student' | 'teacher';

export type { User } from '@/lib/permissions';
export { hasPermission, canAccessAdminPanel, formatUserAccess } from '@/lib/permissions';

export type UserResponse = {
  user: import('@/lib/permissions').User;
};

export type CreateUserResponse = {
  user: import('@/lib/permissions').User;
  temporaryPassword: string;
  mailing?: {
    status: 'sent' | 'skipped' | 'failed' | string;
    errorRaw: string | null;
    errorParsed: string | null;
  };
};

export function mailingNotSentWarning(mailing?: CreateUserResponse['mailing']) {
  if (!mailing || mailing.status === 'sent') return '';
  const detail = mailing.errorParsed?.trim();
  if (mailing.status === 'skipped') {
    return detail ? `Вітальний лист не надіслано: ${detail}` : 'Вітальний лист не надіслано.';
  }
  return detail
    ? `Вітальний лист не надіслано через помилку: ${detail}`
    : 'Вітальний лист не надіслано через помилку.';
}

export type UserStatus = 'active' | 'blocked';

export const USER_ROLE_OPTIONS = [
  { value: '', label: 'Без кабінету' },
  { value: 'student', label: 'Учень' },
  { value: 'teacher', label: 'Вчитель' },
] as const;

export const USER_ROLE_LABELS: Record<UserPanelRole, string> = {
  student: 'Учень',
  teacher: 'Вчитель',
};

export const ADMIN_ACCESS_OPTIONS = [
  { value: '', label: 'Без адмінки' },
  { value: 'super_admin', label: 'Супер-адмін' },
  { value: 'admin_role', label: 'Роль доступу' },
] as const;

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Активний' },
  { value: 'blocked', label: 'Заблокований' },
];

export const ROLE_TABS = [
  { value: '', label: 'Усі' },
  { value: 'student', label: 'Учні' },
  { value: 'teacher', label: 'Вчителі' },
  { value: 'super_admin,admin', label: 'Адміни' },
] as const;

export const EVENT_TYPE_OPTIONS = [
  { value: 'LOGIN_SUCCESS', label: 'Вхід' },
  { value: 'LOGIN_FAILED', label: 'Невдалий вхід' },
  { value: 'LOGOUT', label: 'Вихід' },
  { value: 'LOGOUT_ALL', label: 'Вихід з усіх сесій' },
  { value: 'REFRESH', label: 'Оновлення токена' },
  { value: 'REFRESH_REUSE', label: 'Повтор refresh' },
  { value: 'SESSION_REVOKED', label: 'Сесію відкликано' },
  { value: 'PASSWORD_CHANGED', label: 'Зміна пароля' },
  { value: 'PASSWORD_RESET', label: 'Скидання пароля' },
  { value: 'PROFILE_UPDATED', label: 'Оновлення профілю' },
  { value: 'ACCOUNT_CREATED', label: 'Створення акаунта' },
  { value: 'ACCOUNT_BLOCKED', label: 'Блокування' },
  { value: 'ACCOUNT_UNBLOCKED', label: 'Розблокування' },
  { value: 'PAGE_VIEW', label: 'Перегляд сторінки' },
];

export const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map((item) => [item.value, item.label]),
) as Record<string, string>;

export const PANEL_OPTIONS = [
  { value: 'user', label: 'Кабінет' },
  { value: 'admin', label: 'Адмінка' },
];

export type AuthSession = {
  id: number;
  userId: number;
  panel: 'user' | 'admin';
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
  user: { id: number; email: string; name: string; accessLabel: string } | null;
};

export type AuthEvent = {
  id: number;
  userId: number | null;
  sessionId: number | null;
  type: string;
  panel: 'user' | 'admin' | null;
  path: string | null;
  ip: string | null;
  userAgent: string | null;
  meta: unknown;
  createdAt: string;
  user: { id: number; email: string; name: string; accessLabel: string } | null;
};

export type AuthSummary = {
  activeSessions: number;
  blockedUsers: number;
  loginsToday: number;
  loginsWeek: number;
  failedLoginsToday: number;
  homeViews: number;
  cabinetViews: number;
};

export type AuthRankedUser = {
  count: number;
  user: { id: number; email: string; name: string; accessLabel: string } | null;
};

export type AuthOverview = AuthSummary & {
  totalUsers: number;
  students: number;
  admins: number;
  activeAccounts: number;
  newUsersToday: number;
  newUsersWeek: number;
  neverLoggedIn: number;
  uniqueLoginsToday: number;
  uniqueLoginsWeek: number;
  logoutsToday: number;
  pageViewsToday: number;
  pageViewsWeek: number;
  homeViewsToday: number;
  cabinetViewsToday: number;
  passwordChangesWeek: number;
  onlineNow: number;
  topLogins: AuthRankedUser[];
  topCabinet: AuthRankedUser[];
  topHome: AuthRankedUser[];
};

export type UserAuthStats = {
  loginCount: number;
  failedLoginCount: number;
  homeViews: number;
  cabinetViews: number;
  lastLoginAt: string | null;
};

export type UserAuthResponse = {
  user: import('@/lib/permissions').User;
  stats: UserAuthStats;
  sessions: AuthSession[];
  events: AuthEvent[];
};

export type UserTariffPayment = {
  id: number;
  partNumber: number;
  lessons: number;
  amount: number;
  paid: boolean;
  paidAt: string | null;
};

export type UserTariffRecord = {
  id: number;
  status: 'active' | 'scheduled' | 'expired' | 'cancelled';
  startsAt: string;
  endsAt: string;
  tariff: {
    id: number;
    title: string;
    lessons: number;
    price: number;
    lessonPrice?: number;
    installmentCount?: number;
    durationMonths?: number;
    frozenLessonsPerMonth?: number;
  };
  payments: UserTariffPayment[];
  paidCount: number;
  availableLessons: number;
  totalLessons: number;
};

export type UserTariffsResponse = {
  current: UserTariffRecord | null;
  scheduled: UserTariffRecord | null;
  history: UserTariffRecord[];
};

export type AdminLesson = {
  id: number;
  number: number;
  status: string;
  startDate: string | null;
  startHour: number | null;
  tariffTitle: string;
  frozenAt: string | null;
  refundedAt: string | null;
  refundAmount: number;
  teacher: { id: number; name: string } | null;
};

export type UserLessonsResponse = {
  freeze: { perMonth: number; used: number; left: number } | null;
  lessons: AdminLesson[];
};

export type UserBrief = {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  teacher: { id: number; name: string } | null;
};

export type UserClassResponse = {
  role: UserPanelRole | null;
  teacher: UserBrief | null;
  students: UserBrief[];
};
