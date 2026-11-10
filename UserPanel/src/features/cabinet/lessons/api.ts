import { api } from '@/lib/api';

export type LessonStatus =
  | 'unscheduled'
  | 'proposed'
  | 'confirmed'
  | 'rescheduling'
  | 'done'
  | 'missed'
  | 'admin_skip'
  | 'frozen'
  | 'cancelled';
export type LessonActor = 'teacher' | 'student';

export type CabinetLesson = {
  id: number;
  number: number;
  status: LessonStatus;
  proposedBy: LessonActor | null;
  waitingOn: LessonActor | null;
  startDate: string | null;
  startHour: number | null;
  startMinute: number | null;
  tariffTitle: string;
  frozenAt: string | null;
  refundedAt: string | null;
  refundAmount: number;
  canFreeze: boolean;
  canStudentReschedule: boolean;
  teacher: { id: number; name: string } | null;
  student: { id: number; name: string } | null;
};

export type FreezeQuota = {
  perMonth: number;
  used: number;
  left: number;
};

export type StudentLessonPack = {
  current: {
    id: number;
    title: string;
    startsAt: string;
    endsAt: string;
    availableLessons: number;
    totalLessons: number;
  } | null;
  freeze: FreezeQuota;
  unscheduled: CabinetLesson[];
  upcoming: CabinetLesson[];
  frozen: CabinetLesson[];
  done: CabinetLesson[];
  missed: CabinetLesson[];
  adminSkip: CabinetLesson[];
};

export type TeacherLessonGroup = StudentLessonPack & {
  student: { id: number; name: string; email: string; phone: string | null; avatarUrl: string | null };
};

export type LinkedTest = {
  id: number;
  title: string;
  description: string | null;
  entityType: 'level' | 'course' | 'unit' | 'lesson';
  entityId: number;
  questionCount: number;
  unlocked: boolean;
  expiresAt: string | null;
  entryPassword?: string;
};

export type CabinetLessonCard = {
  lesson: CabinetLesson;
  student: TeacherLessonGroup['student'];
  freeze: FreezeQuota;
  material: LessonMaterial | null;
  linkedTests: LinkedTest[];
};

export type LessonMaterial = {
  title: string;
  description: string | null;
  source: 'content' | 'teacher';
  presentation: {
    id: number;
    originalName: string;
    url: string;
    mime: string;
    sizeBytes: number;
  } | null;
};

export function studentLessonPath(lessonId: number) {
  return `/cabinet/student/lessons/${lessonId}`;
}

export type LessonsBoard =
  | ({ role: 'student' } & StudentLessonPack)
  | { role: 'teacher'; groups: TeacherLessonGroup[] };

export type LessonSlots = {
  from: string;
  hourFrom: number;
  hourTo: number;
  days: { date: string; weekday: number; hours: number[] }[];
  sequence?: {
    blockedReason: string | null;
    hint: string | null;
    afterDate: string | null;
  };
};

export function teacherStudentPath(studentId: number) {
  return `/cabinet/teacher/lessons/${studentId}`;
}

export function teacherLessonPath(studentId: number, lessonId: number) {
  return `/cabinet/teacher/lessons/${studentId}/${lessonId}`;
}

export const cabinetLessonsApi = {
  board: () => api<LessonsBoard>('/api/cabinet/lessons'),
  student: (studentId: number) => api<TeacherLessonGroup>(`/api/cabinet/lessons/students/${studentId}`),
  show: (id: number) => api<CabinetLessonCard>(`/api/cabinet/lessons/${id}`),
  slots: (id: number, from?: string) =>
    api<LessonSlots>(`/api/cabinet/lessons/${id}/slots${from ? `?from=${from}` : ''}`),
  propose: (id: number, date: string, hour: number, minute = 0) =>
    api<LessonsBoard>(`/api/cabinet/lessons/${id}/propose`, {
      method: 'POST',
      body: JSON.stringify({ date, hour, minute }),
    }),
  accept: (id: number) => api<LessonsBoard>(`/api/cabinet/lessons/${id}/accept`, { method: 'POST' }),
  decline: (id: number) => api<LessonsBoard>(`/api/cabinet/lessons/${id}/decline`, { method: 'POST' }),
  freeze: (id: number) => api<LessonsBoard>(`/api/cabinet/lessons/${id}/freeze`, { method: 'POST' }),
  complete: (id: number) => api<LessonsBoard>(`/api/cabinet/lessons/${id}/complete`, { method: 'POST' }),
  miss: (id: number) => api<LessonsBoard>(`/api/cabinet/lessons/${id}/miss`, { method: 'POST' }),
};
