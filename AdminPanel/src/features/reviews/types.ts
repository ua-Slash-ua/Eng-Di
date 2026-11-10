export type ReviewKind = 'manual' | 'user';
export type ReviewTarget = 'school' | 'teacher';

export type ReviewListItem = {
  id: number;
  quote: string;
  author: string;
  result: string;
  rating: number;
  kind: ReviewKind;
  target: ReviewTarget;
  isVerified: boolean;
  teacher?: { id: number; name: string } | null;
};

export type ReviewItem = {
  id: number;
  quote: string;
  author: string;
  result: string;
  rating: number;
  kind: ReviewKind;
  target: ReviewTarget;
  isVerified: boolean;
  userId: number | null;
  teacherId: number | null;
  teacher?: { id: number; name: string } | null;
  user?: { id: number; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
};

export const RATING_OPTIONS = [5, 4, 3, 2, 1].map((rating) => ({
  value: String(rating),
  label: '★'.repeat(rating),
  hint: `${rating} з 5`,
}));

export const KIND_OPTIONS = [
  { value: 'manual', label: 'Ручний' },
  { value: 'user', label: 'Від учня' },
];

export const VERIFIED_OPTIONS = [
  { value: 'true', label: 'Верифіковані' },
  { value: 'pending', label: 'Очікують модерації' },
];

export const TARGET_LABELS: Record<ReviewTarget, string> = {
  school: 'Школа',
  teacher: 'Вчитель',
};

export function reviewKindLabel(kind: ReviewKind) {
  return kind === 'manual' ? 'Ручний' : 'Від учня';
}

export function reviewStatusLabel(item: Pick<ReviewListItem, 'kind' | 'isVerified'>) {
  if (item.kind === 'manual') return 'Ручний';
  return item.isVerified ? 'Верифіковано' : 'Очікує модерації';
}
