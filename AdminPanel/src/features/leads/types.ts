export type LeadCategory = {
  id: number;
  slug: string;
  title: string;
  _count?: { leads: number };
};

export type LeadStatus = 'NEW' | 'IN_PROGRESS' | 'DONE';

export type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: LeadStatus;
  location: string | null;
  createdAt: string;
  category: LeadCategory | null;
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Нова',
  IN_PROGRESS: 'В роботі',
  DONE: 'Закрита',
};

const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: '#8b6ff0',
  IN_PROGRESS: '#ffd24d',
  DONE: '#3fd8b5',
};

export const LEAD_STATUS_OPTIONS = (Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((status) => ({
  value: status,
  label: LEAD_STATUS_LABELS[status],
  swatch: LEAD_STATUS_COLORS[status],
}));

export const LEAD_STATUS_TABS = [
  { value: '', label: 'Усі' },
  { value: 'NEW', label: 'Нові' },
  { value: 'IN_PROGRESS', label: 'В роботі' },
  { value: 'DONE', label: 'Закриті' },
] as const;
