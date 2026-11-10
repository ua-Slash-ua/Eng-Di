'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel } from '@/lib/duplicate';
import { reviewsApi } from '../api';
import { RATING_OPTIONS, TARGET_LABELS, reviewKindLabel, reviewStatusLabel, type ReviewItem } from '../types';
import { CreateReviewButton } from './CreateReviewButton';

export function ReviewEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [item, setItem] = useState<ReviewItem | null>(null);
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  const [result, setResult] = useState('');
  const [rating, setRating] = useState('5');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { dirty, markSaved } = useDirtyForm({ quote, author, result, rating }, Boolean(item));

  useEffect(() => {
    if (!id) return;
    reviewsApi
      .get(id)
      .then((review) => {
        setItem(review);
        setQuote(review.quote);
        setAuthor(review.author);
        setResult(review.result);
        setRating(String(review.rating));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const review = await reviewsApi.update(id, {
        quote,
        author,
        result,
        rating: Number(rating),
      });
      setItem(review);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(next: boolean) {
    if (!item) return;
    setVerifyBusy(true);
    setError('');
    setOk('');
    try {
      const review = await reviewsApi.verify(item.id, next);
      setItem(review);
      setOk(next ? 'Відгук верифіковано' : 'Верифікацію скасовано');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося змінити статус');
    } finally {
      setVerifyBusy(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    if (!window.confirm(`Видалити відгук «${item.author}»?`)) return;
    setError('');
    try {
      await reviewsApi.remove(item.id);
      router.replace('/reviews');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const created = await reviewsApi.create({
        quote: withCopyLabel(quote, 400),
        author,
        result,
        rating: Number(rating),
      });
      router.push(`/reviews/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/reviews" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  const isUserReview = item.kind === 'user';

  return (
    <>
      <PageHead
        sticky
        backHref="/reviews"
        backLabel="До відгуків"
        title={item.author}
        description={
          <MetaBar
            items={[
              { label: 'Тип', value: reviewKindLabel(item.kind) },
              { label: 'Статус', value: reviewStatusLabel(item) },
              { label: 'Кому', value: TARGET_LABELS[item.target] },
              ...(item.teacher ? [{ label: 'Вчитель', value: item.teacher.name }] : []),
              { label: 'Оцінка', value: '★'.repeat(item.rating) },
              { label: 'Оновлено', value: formatDateTime(item.updatedAt) },
              { label: 'Створено', value: formatDateTime(item.createdAt) },
            ]}
          />
        }
        actions={
          <>
            {isUserReview ? (
              <button
                className={`btn${item.isVerified ? ' btn-outline' : ''}`}
                type="button"
                disabled={verifyBusy}
                onClick={() => void onVerify(!item.isVerified)}
              >
                {verifyBusy ? '…' : item.isVerified ? 'Скасувати верифікацію' : 'Верифікувати'}
              </button>
            ) : null}
            <CreateReviewButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            <button className="btn" type="submit" form="review-form" disabled={busy || !dirty}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <RecordActionsMenu
              createLabel="Новий відгук"
              onCreate={() => setCreateOpen(true)}
              onDuplicate={() => void onDuplicate()}
              duplicateBusy={duplicating}
              onDelete={onDelete}
            />
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Відгук</h3>
        </div>
        <form className="form-box" id="review-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          {isUserReview ? (
            <p className="muted">
              Відгук від учня{item.user ? ` (${item.user.email})` : ''}. Після змін учнем верифікація скидається автоматично.
            </p>
          ) : null}
          <label htmlFor="quote">Текст</label>
          <textarea
            id="quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            required
            minLength={2}
            maxLength={400}
            rows={4}
          />
          <label htmlFor="author">Імʼя</label>
          <input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            readOnly={isUserReview}
          />
          <label htmlFor="result">Прогрес</label>
          <input id="result" value={result} onChange={(e) => setResult(e.target.value)} required minLength={2} maxLength={80} />
          <label htmlFor="rating">Оцінка</label>
          <Select id="rating" value={rating} onChange={setRating} options={RATING_OPTIONS} />
        </form>
      </div>
    </>
  );
}
