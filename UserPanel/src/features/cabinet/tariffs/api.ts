import { api } from '@/lib/api';

export type CabinetTariff = {
  id: number;
  title: string;
  lessons: number;
  price: number;
  oldPrice: number | null;
  popular: boolean;
  note: string;
  variant: string;
  icon: string | null;
  lessonPrice: number;
  installmentCount: number;
  durationMonths: number;
  frozenLessonsPerMonth?: number;
};

export type CabinetTariffPayment = {
  id: number;
  partNumber: number;
  lessons: number;
  amount: number;
  paid: boolean;
  paidAt: string | null;
};

export type CabinetUserTariff = {
  id: number;
  status: 'active' | 'scheduled' | 'expired' | 'cancelled';
  startsAt: string;
  endsAt: string;
  tariff: CabinetTariff;
  payments: CabinetTariffPayment[];
  paidCount: number;
  availableLessons: number;
  totalLessons: number;
};

export type CabinetTariffsResponse = {
  tariffs: CabinetTariff[];
  current: CabinetUserTariff | null;
  scheduled: CabinetUserTariff | null;
  history: CabinetUserTariff[];
  needsConfirm?: boolean;
  message?: string;
};

export const cabinetTariffsApi = {
  overview: () => api<CabinetTariffsResponse>('/api/cabinet/tariffs'),
  select: (id: number, confirm = false) =>
    api<CabinetTariffsResponse>(`/api/cabinet/tariffs/${id}/select`, {
      method: 'POST',
      body: JSON.stringify({ confirm }),
    }),
  cancelScheduled: () =>
    api<CabinetTariffsResponse>('/api/cabinet/tariffs/scheduled/cancel', { method: 'POST' }),
};
