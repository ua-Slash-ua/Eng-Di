import { api } from '@/lib/api';

export type HourState = 'free' | 'off' | 'busy' | 'lesson' | 'proposed';

export type ScheduleLessonMark = {
  id: number;
  number: number;
  status: string;
  with: string;
  studentId: number;
  proposedBy: 'teacher' | 'student' | null;
  waitingOn: 'teacher' | 'student' | null;
  canStudentReschedule?: boolean;
};

export type ScheduleRule = {
  id: number;
  kind: 'work' | 'busy';
  scope: 'weekly' | 'date' | 'daily';
  weekday: number | null;
  date: string | null;
  startMinute: number;
  endMinute: number;
};

export type WorkDayInput = {
  weekday: number;
  off: boolean;
  startMinute: number;
  endMinute: number;
};

export type ScheduleOverview = {
  from: string;
  hourFrom: number;
  hourTo: number;
  days: {
    date: string;
    weekday: number;
    hours: { hour: number; state: HourState; lesson: ScheduleLessonMark | null }[];
  }[];
  work: ScheduleRule[];
  busy: ScheduleRule[];
};

export const cabinetScheduleApi = {
  week: (from?: string) =>
    api<ScheduleOverview>(`/api/cabinet/schedule${from ? `?from=${from}` : ''}`),
  saveWork: (days: WorkDayInput[], from?: string) =>
    api<ScheduleOverview>(`/api/cabinet/schedule/work${from ? `?from=${from}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify({ days }),
    }),
  addBusy: (
    body: { scope: 'weekly' | 'date' | 'daily'; weekday?: number; date?: string; startMinute: number; endMinute: number },
    from?: string,
  ) =>
    api<ScheduleOverview>(`/api/cabinet/schedule/busy${from ? `?from=${from}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  remove: (id: number, from?: string) =>
    api<ScheduleOverview>(`/api/cabinet/schedule/${id}${from ? `?from=${from}` : ''}`, { method: 'DELETE' }),
};
