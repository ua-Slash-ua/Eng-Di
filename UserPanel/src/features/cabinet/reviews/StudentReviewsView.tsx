'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { MenuSelect } from '@/features/cabinet/schedule/TimeSelect';
import {
  TARGET_OPTIONS,
  reviewStatusLabel,
  reviewsApi,
  type CabinetReview,
  type ReviewTarget,
  type TeacherOption,
} from './api';

const PROGRESS_ARROW = ' → ';

function reviewSlots(items: CabinetReview[], excludeId?: number) {
  const relevant = excludeId ? items.filter((item) => item.id !== excludeId) : items;
  const hasSchool = relevant.some((item) => item.target === 'school');
  const teacherIds = new Set(
    relevant
      .filter((item) => item.target === 'teacher' && item.teacherId)
      .map((item) => item.teacherId as number),
  );
  return { hasSchool, teacherIds };
}

function canCreateReview(items: CabinetReview[], teachers: TeacherOption[]) {
  const { hasSchool, teacherIds } = reviewSlots(items);
  return !hasSchool || teachers.some((teacher) => !teacherIds.has(teacher.id));
}

function availableTargetOptions(items: CabinetReview[], excludeId?: number) {
  const { hasSchool } = reviewSlots(items, excludeId);
  return hasSchool ? TARGET_OPTIONS.filter((option) => option.value === 'teacher') : TARGET_OPTIONS;
}

function teacherOptions(teachers: TeacherOption[], takenTeacherIds: Set<number>, allowTeacherId?: number) {
  const available = teachers.filter(
    (teacher) => !takenTeacherIds.has(teacher.id) || teacher.id === allowTeacherId,
  );
  return [
    { value: '', label: 'Оберіть вчителя' },
    ...available.map((teacher) => ({ value: String(teacher.id), label: teacher.name })),
  ];
}

function ProgressInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function insertArrow() {
    const el = inputRef.current;
    if (!el) {
      const next = `${value}${PROGRESS_ARROW}`;
      if (next.length <= 80) onChange(next);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${PROGRESS_ARROW}${value.slice(end)}`;
    if (next.length > 80) return;
    onChange(next);
    requestAnimationFrame(() => {
      const pos = start + PROGRESS_ARROW.length;
      el.setSelectionRange(pos, pos);
      el.focus();
    });
  }

  return (
    <div className="review-progress-field">
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={2}
        maxLength={80}
        placeholder={placeholder}
      />
      <button type="button" className="review-arrow-btn" onClick={insertArrow} aria-label="Вставити стрілку">
        →
      </button>
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="review-stars-input" role="radiogroup" aria-label="Оцінка">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`review-star-btn${star <= value ? ' is-active' : ''}`}
          aria-label={`${star} з 5`}
          aria-pressed={star <= value}
          onClick={() => onChange(star)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewCard({
  item,
  items,
  teachers,
  onChanged,
}: {
  item: CabinetReview;
  items: CabinetReview[];
  teachers: TeacherOption[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState<ReviewTarget>(item.target);
  const [teacherId, setTeacherId] = useState(String(item.teacherId ?? ''));
  const [quote, setQuote] = useState(item.quote);
  const [result, setResult] = useState(item.result);
  const [rating, setRating] = useState(item.rating);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { teacherIds } = reviewSlots(items, item.id);
  const targetOptions = useMemo(() => availableTargetOptions(items, item.id), [items, item.id]);
  const teacherSelectOptions = useMemo(
    () => teacherOptions(teachers, teacherIds, item.teacherId ?? undefined),
    [teachers, teacherIds, item.teacherId],
  );

  useEffect(() => {
    if (!targetOptions.some((option) => option.value === target)) {
      setTarget(targetOptions[0]?.value === 'teacher' ? 'teacher' : 'school');
    }
  }, [target, targetOptions]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (target === 'teacher' && !teacherId) {
      setError('Оберіть вчителя');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await reviewsApi.update(item.id, {
        target,
        teacherId: target === 'teacher' ? Number(teacherId) : null,
        quote,
        result,
        rating,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!window.confirm('Видалити цей відгук?')) return;
    setBusy(true);
    setError('');
    try {
      await reviewsApi.remove(item.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
      setBusy(false);
    }
  }

  const targetLabel = TARGET_OPTIONS.find((option) => option.value === target)?.label ?? target;
  const teacherName = item.teacher?.name ?? teachers.find((t) => t.id === item.teacherId)?.name;

  return (
    <article className="cabinet-card review-card">
      <div className="review-card-head">
        <div>
          <strong>{targetLabel}</strong>
          {teacherName ? <span className="muted"> · {teacherName}</span> : null}
        </div>
        <span className={`review-status${item.isVerified ? ' is-verified' : ''}`}>{reviewStatusLabel(item)}</span>
      </div>
      {!editing ? (
        <>
          <div className="review-stars-display">{'★'.repeat(item.rating)}</div>
          <p className="review-quote">{item.quote}</p>
          <p className="review-progress">{item.result}</p>
          {!item.isVerified ? (
            <p className="muted review-hint">Після редагування відгук знову потребує модерації адміністратора.</p>
          ) : null}
          <div className="review-card-actions">
            <button type="button" className="btn btn-outline" onClick={() => setEditing(true)} disabled={busy}>
              Редагувати
            </button>
            <button type="button" className="btn btn-outline" onClick={() => void onDelete()} disabled={busy}>
              Видалити
            </button>
          </div>
        </>
      ) : (
        <form className="form-box review-form" onSubmit={onSave}>
          {error ? <p className="form-error">{error}</p> : null}
          <label htmlFor={`target-${item.id}`}>Кому</label>
          <MenuSelect
            value={target}
            options={targetOptions}
            onChange={(value) => setTarget(value as ReviewTarget)}
            ariaLabel="Кому"
          />
          {target === 'teacher' ? (
            <>
              <label htmlFor={`teacher-${item.id}`}>Вчитель</label>
              <MenuSelect
                value={teacherId}
                options={teacherSelectOptions}
                onChange={setTeacherId}
                ariaLabel="Вчитель"
              />
            </>
          ) : null}
          <label>Оцінка</label>
          <StarPicker value={rating} onChange={setRating} />
          <label htmlFor={`quote-${item.id}`}>Текст відгуку</label>
          <textarea
            id={`quote-${item.id}`}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            required
            minLength={2}
            maxLength={400}
            rows={4}
          />
          <label htmlFor={`result-${item.id}`}>Ваш прогрес</label>
          <ProgressInput
            id={`result-${item.id}`}
            value={result}
            onChange={setResult}
            placeholder="A2 → B2 за 6 місяців"
          />
          <div className="review-card-actions">
            <button type="submit" className="btn" disabled={busy}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(false)} disabled={busy}>
              Скасувати
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

export function StudentReviewsView() {
  const [items, setItems] = useState<CabinetReview[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [target, setTarget] = useState<ReviewTarget>('school');
  const [teacherId, setTeacherId] = useState('');
  const [quote, setQuote] = useState('');
  const [result, setResult] = useState('');
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);

  const { teacherIds } = reviewSlots(items);
  const allowCreate = canCreateReview(items, teachers);
  const targetOptions = useMemo(() => availableTargetOptions(items), [items]);
  const teacherSelectOptions = useMemo(
    () => teacherOptions(teachers, teacherIds),
    [teachers, teacherIds],
  );

  useEffect(() => {
    if (!targetOptions.some((option) => option.value === target)) {
      setTarget(targetOptions[0]?.value === 'teacher' ? 'teacher' : 'school');
    }
  }, [target, targetOptions]);

  async function reload() {
    setLoading(true);
    setError('');
    try {
      const [reviews, teacherList] = await Promise.all([reviewsApi.list(), reviewsApi.teachers()]);
      setItems(reviews);
      setTeachers(teacherList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити відгуки');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (target === 'teacher' && !teacherId) {
      setError('Оберіть вчителя');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await reviewsApi.create({
        target,
        teacherId: target === 'teacher' ? Number(teacherId) : undefined,
        quote,
        result,
        rating,
      });
      setQuote('');
      setResult('');
      setRating(5);
      setTarget('school');
      setTeacherId('');
      setShowForm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати відгук');
    } finally {
      setBusy(false);
    }
  }

  return (
    <CabinetPage
      title="Відгуки"
      lead="Один відгук про школу і по одному на кожного вчителя. Після модерації відгук може зʼявитися на сайті."
    >
      {error ? <p className="form-error">{error}</p> : null}

      {!showForm ? (
        allowCreate ? (
          <button type="button" className="btn" onClick={() => setShowForm(true)}>
            Написати відгук
          </button>
        ) : (
          <p className="muted">Ви вже залишили всі доступні відгуки.</p>
        )
      ) : (
        <form className="cabinet-card form-box review-form" onSubmit={onCreate}>
          <h3>Новий відгук</h3>
          <label htmlFor="new-target">Кому</label>
          <MenuSelect
            value={target}
            options={targetOptions}
            onChange={(value) => setTarget(value as ReviewTarget)}
            ariaLabel="Кому"
          />
          {target === 'teacher' ? (
            <>
              <label htmlFor="new-teacher">Вчитель</label>
              <MenuSelect
                value={teacherId}
                options={teacherSelectOptions}
                onChange={setTeacherId}
                ariaLabel="Вчитель"
              />
            </>
          ) : null}
          <label>Оцінка</label>
          <StarPicker value={rating} onChange={setRating} />
          <label htmlFor="new-quote">Текст відгуку</label>
          <textarea
            id="new-quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            required
            minLength={2}
            maxLength={400}
            rows={4}
            placeholder="Розкажіть про свій досвід навчання…"
          />
          <label htmlFor="new-result">Ваш прогрес</label>
          <ProgressInput
            id="new-result"
            value={result}
            onChange={setResult}
            placeholder="A2 → B2 за 6 місяців"
          />
          <div className="review-card-actions">
            <button type="submit" className="btn" disabled={busy}>
              {busy ? 'Надсилання…' : 'Надіслати на модерацію'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} disabled={busy}>
              Скасувати
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="muted">Завантаження…</p>
      ) : items.length ? (
        <div className="review-list">
          {items.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              items={items}
              teachers={teachers}
              onChanged={() => void reload()}
            />
          ))}
        </div>
      ) : (
        <p className="muted">У вас ще немає відгуків.</p>
      )}
    </CabinetPage>
  );
}
