import { api } from '@/lib/api';
import { listQuery, type ListParams, type Paginated } from '@/lib/pagination';

export type MailingType =
  | 'welcome_registration'
  | 'password_reset'
  | 'lesson_reminder'
  | 'lesson_teacher_proposed'
  | 'lesson_student_confirmed'
  | 'lesson_student_counter'
  | 'lesson_teacher_confirmed'
  | 'lesson_declined'
  | 'lesson_frozen_student'
  | 'lesson_frozen_teacher'
  | 'tariff_selected';

export const MAILING_TYPE_OPTIONS: Array<{ value: MailingType; label: string }> = [
  { value: 'welcome_registration', label: 'Вітання після реєстрації' },
  { value: 'password_reset', label: 'Зміна / скидання паролю' },
  { value: 'lesson_reminder', label: 'Нагадування про урок за годину' },
  { value: 'lesson_teacher_proposed', label: 'Учитель запропонував час уроку' },
  { value: 'lesson_student_confirmed', label: 'Учень підтвердив час уроку' },
  { value: 'lesson_student_counter', label: 'Учень запропонував інший час' },
  { value: 'lesson_teacher_confirmed', label: 'Учитель підтвердив час уроку' },
  { value: 'lesson_declined', label: 'Пропозицію щодо уроку відхилено' },
  { value: 'lesson_frozen_student', label: 'Урок заморожено (учень)' },
  { value: 'lesson_frozen_teacher', label: 'Урок заморожено (учитель)' },
  { value: 'tariff_selected', label: 'Дякуємо за обраний тариф' },
];

export type MailingTemplate = {
  subject: string;
  body: string;
};

export type MailingSettings = {
  enabled: boolean;
  flags: Record<MailingType, boolean>;
  templates: Record<MailingType, MailingTemplate>;
  welcomeRegistration?: boolean;
  passwordReset?: boolean;
};

export type MailingSettingsUpdate = {
  enabled?: boolean;
  flags?: Partial<Record<MailingType, boolean>>;
  templates?: Partial<Record<MailingType, MailingTemplate>>;
};

export type MailingSettingsPayload = {
  settings: MailingSettings;
};

export type MailingLog = {
  id: number;
  type: string;
  typeLabel: string;
  email: string;
  reason: string;
  status: 'sent' | 'skipped' | 'failed' | string;
  error: string | null;
  errorRaw: string | null;
  errorParsed: string | null;
  createdAt: string;
  user: { id: number; name: string; email: string } | null;
};

type MailingsLogsApiResponse = {
  logs: MailingLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type MailingTask = {
  id: number;
  kind: string;
  kindLabel: string;
  mailingType: string;
  audience: string;
  audienceLabel: string;
  status: string;
  statusLabel: string;
  overdue: boolean;
  scheduledAt: string;
  processedAt: string | null;
  email: string;
  reason: string;
  error: string | null;
  errorRaw: string | null;
  mailingLogId: number | null;
  createdAt: string;
  user: { id: number; name: string; email: string } | null;
  lesson: { id: number; number: number; status: string; startsAt: string | null } | null;
};

type MailingTasksApiResponse = {
  tasks: MailingTask[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type MailingCronRun = {
  id: number;
  action: string;
  actionLabel: string;
  status: string;
  statusLabel: string;
  startedAt: string;
  finishedAt: string | null;
  scanned: number;
  enqueued: number;
  cancelled: number;
  claimed: number;
  sent: number;
  skipped: number;
  failed: number;
  overdue: number;
  error: string | null;
};

type MailingCronRunsApiResponse = {
  runs: MailingCronRun[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type MailingStatusCounts = {
  sent: number;
  skipped: number;
  failed: number;
  total: number;
};

export type MailingStats = {
  totals: MailingStatusCounts;
  today: MailingStatusCounts;
  week: MailingStatusCounts;
  uniqueEmails: number;
  moduleEnabled: boolean;
  enabledTypes: number;
  typesTotal: number;
  successRate: number | null;
  byType: Array<MailingStatusCounts & { type: string; typeLabel: string }>;
  days: Array<MailingStatusCounts & { date: string; label: string }>;
  failed: Array<{
    id: number;
    type: string;
    typeLabel: string;
    email: string;
    error: string | null;
    createdAt: string;
  }>;
};

export const mailingsApi = {
  getSettings: () => api<MailingSettingsPayload>('/api/admin/settings/mailings'),
  updateSettings: (body: MailingSettingsUpdate) =>
    api<MailingSettingsPayload>('/api/admin/settings/mailings', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  stats: () => api<MailingStats>('/api/admin/mailings/stats'),
  logs: async (query: ListParams = {}): Promise<Paginated<MailingLog>> => {
    const data = await api<MailingsLogsApiResponse>(`/api/admin/mailings/logs${listQuery(query)}`);
    return {
      items: data.logs,
      total: data.total,
      page: data.page,
      limit: data.limit,
      pageCount: data.pages,
    };
  },
  tasks: async (query: ListParams = {}): Promise<Paginated<MailingTask>> => {
    const data = await api<MailingTasksApiResponse>(`/api/admin/mailings/tasks${listQuery(query)}`);
    return {
      items: data.tasks,
      total: data.total,
      page: data.page,
      limit: data.limit,
      pageCount: data.pages,
    };
  },
  cronRuns: async (query: ListParams = {}): Promise<Paginated<MailingCronRun>> => {
    const data = await api<MailingCronRunsApiResponse>(`/api/admin/mailings/cron-runs${listQuery(query)}`);
    return {
      items: data.runs,
      total: data.total,
      page: data.page,
      limit: data.limit,
      pageCount: data.pages,
    };
  },
};
