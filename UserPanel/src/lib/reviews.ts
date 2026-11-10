import { API_URL } from './page';

export type Review = {
  id: number;
  quote: string;
  author: string;
  result: string;
  rating: number;
  sortOrder: number;
  isOfficialAccount?: boolean;
};

const FALLBACK: Review[] = [
  {
    id: 1,
    quote: 'За півроку перейшла з A2 на B2 — і це відчутно на співбесідах.',
    author: 'Марія Т.',
    result: 'A2 → B2 за 6 місяців',
    rating: 5,
    sortOrder: 1,
  },
  {
    id: 2,
    quote: 'Пояснюють настільки просто, що граматика нарешті «клацнула».',
    author: 'Андрій С.',
    result: 'B1 → B2',
    rating: 5,
    sortOrder: 2,
  },
  {
    id: 3,
    quote: 'Здала IELTS на 7.5 після трьох місяців занять за чітким планом.',
    author: 'Юлія В.',
    result: 'B2 → C1',
    rating: 5,
    sortOrder: 3,
  },
];

export async function fetchReviews(): Promise<Review[]> {
  try {
    const response = await fetch(`${API_URL}/api/reviews`, { cache: 'no-store' });
    if (!response.ok) {
      return FALLBACK;
    }
    const items = (await response.json()) as Review[];
    return items.length ? items : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function starLabel(rating: number) {
  const n = Math.min(5, Math.max(1, rating));
  return '★'.repeat(n);
}
