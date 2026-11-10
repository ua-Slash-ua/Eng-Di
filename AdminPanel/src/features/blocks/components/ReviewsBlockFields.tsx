'use client';

import { MultiSelect } from '@/components/fields/MultiSelect';
import type { ReviewOption } from '../types';

type ReviewsBlockFieldsProps = {
  reviewIds: number[];
  setReviewIds: (value: number[]) => void;
  reviews: ReviewOption[];
};

export function ReviewsBlockFields({ reviewIds, setReviewIds, reviews }: ReviewsBlockFieldsProps) {
  return (
    <>
      <p className="muted">Плашка й заголовок вище — як на сайті. Картки беруться з розділу «Відгуки».</p>
      <MultiSelect
        title="Відгуки"
        hint="Порядок вибору = порядок у слайдері. Якщо порожньо — візьмуться всі з каталогу."
        placeholder="Обрати відгуки"
        value={reviewIds}
        onChange={setReviewIds}
        options={reviews.map((item) => ({
          id: item.id,
          title: item.author,
          subtitle: `${item.kind === 'user' ? 'Учень · ' : ''}${'★'.repeat(Math.min(5, Math.max(1, item.rating)))} · ${item.result}`,
        }))}
      />
    </>
  );
}
