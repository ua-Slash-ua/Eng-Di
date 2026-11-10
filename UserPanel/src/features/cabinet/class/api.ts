import { api } from '@/lib/api';

export type CabinetPerson = {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'blocked';
};

export type CabinetStudentCard = {
  student: CabinetPerson & {
    firstName: string | null;
    lastName: string | null;
    middleName: string | null;
    phone: string | null;
    birthDate: string | null;
    avatarUrl: string | null;
    createdAt: string;
    activatedAt: string | null;
    isActivated: boolean;
    lessons: {
      total: number;
      unscheduled: number;
      proposed: number;
      confirmed: number;
      done: number;
      missed: number;
      adminSkip: number;
      frozen: number;
    };
  };
  tariff: {
    title: string;
    startsAt: string;
    endsAt: string;
    availableLessons: number;
    totalLessons: number;
  } | null;
};

export type CabinetClass = {
  role: 'student' | 'teacher' | null;
  teacher: CabinetPerson | null;
  students: CabinetPerson[];
};

export const cabinetClassApi = {
  mine: () => api<CabinetClass>('/api/cabinet/class'),
  student: (id: number) => api<CabinetStudentCard>(`/api/cabinet/class/students/${id}`),
};
