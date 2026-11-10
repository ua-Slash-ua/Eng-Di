'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { Select } from '@/components/ui/Select';
import { reviewsApi } from '../api';
import { RATING_OPTIONS } from '../types';

type CreateReviewButtonProps = {
  variant?: 'primary' | 'outline';
  /** Runs instead of opening the freshly created review. */
  onCreated?: () => void;
} & CreateModalControl;

export function CreateReviewButton({ variant, onCreated, hideTrigger, open, onOpenChange }: CreateReviewButtonProps) {
  const router = useRouter();
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [result, setResult] = useState('');
  const [rating, setRating] = useState('5');

  function reset() {
    setQuote('');
    setAuthor('');
    setResult('');
    setRating('5');
  }

  async function onCreate() {
    const created = await reviewsApi.create({ quote, author, result, rating: Number(rating) });
    reset();
    if (onCreated) {
      onCreated();
    } else {
      router.push(`/reviews/${created.id}`);
    }
  }

  return (
    <CreateButton
      label="Новий відгук"
      modalTitle="Новий відгук"
      variant={variant}
      onCreate={onCreate}
      onOpen={reset}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label htmlFor="new-review-quote">Текст</label>
      <textarea
        id="new-review-quote"
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        required
        minLength={2}
        maxLength={400}
        rows={4}
      />
      <label htmlFor="new-review-author">Імʼя</label>
      <input
        id="new-review-author"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        required
        minLength={2}
        maxLength={80}
        placeholder="Марія Т."
      />
      <label htmlFor="new-review-result">Прогрес</label>
      <input
        id="new-review-result"
        value={result}
        onChange={(e) => setResult(e.target.value)}
        required
        minLength={2}
        maxLength={80}
        placeholder="A2 → B2 за 6 місяців"
      />
      <label htmlFor="new-review-rating">Оцінка</label>
      <Select id="new-review-rating" value={rating} onChange={setRating} options={RATING_OPTIONS} />
    </CreateButton>
  );
}
