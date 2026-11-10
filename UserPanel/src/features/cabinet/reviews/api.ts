import { api } from '@/lib/api';

export type ReviewTarget = 'school' | 'teacher';

export type CabinetReview = {
  id: number;
  quote: string;
  author: string;
  result: string;
  rating: number;
  target: ReviewTarget;
  teacherId: number | null;
  isVerified: boolean;
  kind: 'manual' | 'user';
  teacher?: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type TeacherOption = {
  id: number;
  name: string;
};

export const reviewsApi = {
  list: () => api<CabinetReview[]>('/api/cabinet/reviews'),
  teachers: () => api<TeacherOption[]>('/api/cabinet/reviews/teachers'),
  create: (body: {
    target: ReviewTarget;
    teacherId?: number;
    quote: string;
    result: string;
    rating: number;
  }) => api<CabinetReview>('/api/cabinet/reviews', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: number,
    body: Partial<{
      target: ReviewTarget;
      teacherId: number | null;
      quote: string;
      result: string;
      rating: number;
    }>,
  ) => api<CabinetReview>(`/api/cabinet/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/cabinet/reviews/${id}`, { method: 'DELETE' }),
};

export const TARGET_OPTIONS = [
  { value: 'school', label: 'Школа' },
  { value: 'teacher', label: 'Вчитель' },
];

export const RATING_OPTIONS = [5, 4, 3, 2, 1].map((rating) => ({
  value: String(rating),
  label: '★'.repeat(rating),
}));

export function reviewStatusLabel(item: Pick<CabinetReview, 'isVerified'>) {
  return item.isVerified ? 'Опубліковано' : 'На модерації';
}
