'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { curriculumApi } from '@/features/curriculum/api';
import type { ContentLesson } from '@/features/curriculum/types';
import { testsApi } from '../api';
import { TestAccessPanel } from './TestAccessPanel';
import { TestAttemptQuotasPanel } from './TestAttemptQuotasPanel';
import {
  DURATION_LABELS,
  KIND_LABELS,
  type ContentEntityType,
  type TestAccessDuration,
  type TestAnswerOption,
  type TestAttemptReview,
  type TestAttemptRow,
  type TestItem,
  type TestKind,
  type TestQuestion,
  type TestStats,
} from '../types';

type Tab = 'settings' | 'questions' | 'access' | 'history';

function randomPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function emptyOption(sortOrder: number): TestAnswerOption {
  return { text: '', kind: 'choice', isCorrect: false, sortOrder };
}

function emptyQuestion(sortOrder: number): TestQuestion {
  return {
    prompt: '',
    sortOrder,
    options: [emptyOption(1), emptyOption(2)],
  };
}

const ENTITY_KIND_LABEL: Record<ContentEntityType, string> = {
  level: 'Рівень',
  course: 'Курс',
  unit: 'Юніт',
  lesson: 'Урок',
};

function lessonHint(lesson: { unit?: ContentLesson['unit'] | null; isFree?: boolean }) {
  const parts = [ENTITY_KIND_LABEL.lesson];
  const path = [
    lesson.unit?.course?.level?.code,
    lesson.unit?.course?.title,
    lesson.unit?.title,
  ].filter(Boolean);
  if (path.length) parts.push(path.join(' · '));
  if (lesson.isFree) parts.push('вільний');
  return parts.join(' · ');
}

export function TestEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const isNew = id === 'new';
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('settings');
  const [item, setItem] = useState<TestItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<TestKind>('free');
  const [entityType, setEntityType] = useState<ContentEntityType | ''>('lesson');
  const [entityId, setEntityId] = useState('');
  const [accessDuration, setAccessDuration] = useState<TestAccessDuration>('forever');
  const [entryPassword, setEntryPassword] = useState(randomPassword);
  const [randomize, setRandomize] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [questions, setQuestions] = useState<TestQuestion[]>([emptyQuestion(1)]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const [entityOptions, setEntityOptions] = useState<Array<{ value: string; label: string; hint?: string }>>([]);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [attempts, setAttempts] = useState<TestAttemptRow[]>([]);
  const [review, setReview] = useState<TestAttemptReview | null>(null);

  const formState = { title, description, kind, entityType, entityId, accessDuration, entryPassword, randomize, maxAttempts, questions };
  const { dirty, markSaved } = useDirtyForm(formState, isNew || Boolean(item));

  const loadEntityOptions = useCallback(async (type: ContentEntityType | '') => {
    if (!type) {
      setEntityOptions([]);
      return;
    }
    try {
      if (type === 'level') {
        const rows = await curriculumApi.listLevels();
        setEntityOptions(
          rows.map((r) => ({
            value: String(r.id),
            label: `${r.code} — ${r.title}`,
            hint: ENTITY_KIND_LABEL.level,
          })),
        );
      } else if (type === 'course') {
        const rows = await curriculumApi.listCourses();
        setEntityOptions(
          rows.map((r) => ({
            value: String(r.id),
            label: r.title,
            hint: [ENTITY_KIND_LABEL.course, r.level ? `${r.level.code} — ${r.level.title}` : r.isFree ? 'вільний' : null]
              .filter(Boolean)
              .join(' · '),
          })),
        );
      } else if (type === 'unit') {
        const rows = await curriculumApi.listUnits();
        setEntityOptions(
          rows.map((r) => ({
            value: String(r.id),
            label: r.title,
            hint: [
              ENTITY_KIND_LABEL.unit,
              r.course?.level?.code,
              r.course?.title,
              r.isFree ? 'вільний' : null,
            ]
              .filter(Boolean)
              .join(' · '),
          })),
        );
      } else {
        const rows = await curriculumApi.listLessons();
        setEntityOptions(
          rows.map((r) => ({
            value: String(r.id),
            label: r.title,
            hint: lessonHint(r),
          })),
        );
      }
    } catch {
      setEntityOptions([]);
    }
  }, []);

  useEffect(() => {
    if (kind === 'material' && entityType) void loadEntityOptions(entityType);
  }, [kind, entityType, loadEntityOptions]);

  useEffect(() => {
    if (isNew) return;
    testsApi
      .get(Number(id))
      .then((data) => {
        setItem(data);
        setTitle(data.title);
        setDescription(data.description ?? '');
        setKind(data.kind);
        setEntityType(data.entityType ?? 'lesson');
        setEntityId(data.entityId != null ? String(data.entityId) : '');
        setAccessDuration(data.accessDuration);
        setEntryPassword(data.entryPassword);
        setRandomize(data.randomize);
        setMaxAttempts(data.maxAttempts ?? 3);
        setQuestions(
          data.questions?.length
            ? data.questions.map((q, i) => ({
                id: q.id,
                prompt: q.prompt,
                sortOrder: q.sortOrder ?? i + 1,
                options: q.options.map((o, oi) => ({
                  id: o.id,
                  text: o.text,
                  kind: o.kind,
                  isCorrect: o.isCorrect,
                  sortOrder: o.sortOrder ?? oi + 1,
                })),
              }))
            : [emptyQuestion(1)],
        );
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id, isNew]);

  useEffect(() => {
    if (isNew || tab !== 'history') return;
    Promise.all([testsApi.stats(Number(id)), testsApi.attempts(Number(id))])
      .then(([nextStats, nextAttempts]) => {
        setStats(nextStats);
        setAttempts(nextAttempts);
      })
      .catch(() => {});
  }, [id, isNew, tab]);

  function buildBody() {
    return {
      title,
      description: description || null,
      kind,
      entityType: kind === 'material' ? entityType || null : null,
      entityId: kind === 'material' && entityId ? Number(entityId) : null,
      accessDuration,
      entryPassword,
      randomize,
      maxAttempts,
      questions: questions.map((q, qi) => ({
        id: q.id,
        prompt: q.prompt,
        sortOrder: qi + 1,
        options: q.options.map((o, oi) => ({
          id: o.id,
          text: o.text,
          kind: o.kind,
          isCorrect: o.isCorrect,
          sortOrder: oi + 1,
        })),
      })),
    };
  }

  function validateQuestionsClient(): string | null {
    for (let qi = 0; qi < questions.length; qi += 1) {
      const q = questions[qi];
      const label = `Питання ${qi + 1}`;
      if (!q.prompt.trim()) return `${label}: вкажіть текст питання`;
      if (!q.options.length) return `${label}: додайте хоча б одну відповідь`;
      for (const o of q.options) {
        if (!o.text.trim()) return `${label}: текст відповіді не може бути порожнім`;
      }
      const writeIns = q.options.filter((o) => o.kind === 'write_in');
      if (writeIns.length > 1) return `${label}: не більше однієї write-in відповіді`;
      const hasWriteIn = writeIns.some((o) => o.text.trim());
      const hasCorrectChoice = q.options.some((o) => o.kind === 'choice' && o.isCorrect);
      if (!hasWriteIn && !hasCorrectChoice) {
        return `${label}: відмітьте хоча б одну правильну відповідь`;
      }
    }
    return null;
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    const invalid = validateQuestionsClient();
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    try {
      const body = buildBody();
      if (isNew) {
        const created = await testsApi.create(body);
        router.replace(`/materials/tests/${created.id}`);
        return;
      }
      const updated = await testsApi.update(Number(id), body);
      setItem(updated);
      setQuestions(
        updated.questions?.length
          ? updated.questions.map((q, i) => ({
              id: q.id,
              prompt: q.prompt,
              sortOrder: q.sortOrder ?? i + 1,
              options: q.options.map((o, oi) => ({
                id: o.id,
                text: o.text,
                kind: o.kind,
                isCorrect: o.isCorrect,
                sortOrder: o.sortOrder ?? oi + 1,
              })),
            }))
          : [emptyQuestion(1)],
      );
      markSaved();
      setOk('Збережено. Результати зданих спроб перераховано.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    if (!window.confirm(`Видалити тест «${item.title}»?`)) return;
    try {
      await testsApi.remove(item.id);
      router.replace('/materials/tests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  function moveQuestion(from: number, to: number) {
    if (to < 0 || to >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });
  }

  function moveOption(qi: number, from: number, to: number) {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qi) return q;
        if (to < 0 || to >= q.options.length) return q;
        const options = [...q.options];
        const [row] = options.splice(from, 1);
        options.splice(to, 0, row);
        return { ...q, options };
      }),
    );
  }

  const attemptColumns = useMemo<Column<TestAttemptRow>[]>(
    () => [
      {
        key: 'user',
        header: 'Користувач',
        render: (row) => (
          <>
            <div className="student-name">{row.user.name}</div>
            <div className="student-email">
              {row.user.email} · {row.user.userRole ?? '—'}
            </div>
          </>
        ),
      },
      {
        key: 'status',
        header: 'Статус',
        width: '9.7222vw',
        render: (row) =>
          row.status === 'submitted'
            ? 'Здано'
            : row.status === 'in_progress'
              ? 'В процесі'
              : row.status === 'expired'
                ? 'Прострочено'
                : row.status,
      },
      {
        key: 'score',
        header: 'Бал',
        width: '6.9444vw',
        render: (row) => (row.score != null ? `${row.score}%` : '—'),
      },
      {
        key: 'startedAt',
        header: 'Початок',
        width: '11.1111vw',
        render: (row) => formatDateTime(row.startedAt),
      },
      {
        key: 'submittedAt',
        header: 'Здано',
        width: '11.1111vw',
        render: (row) => (row.submittedAt ? formatDateTime(row.submittedAt) : '—'),
      },
    ],
    [],
  );

  if (error && !item && !isNew) return <LoadError message={error} href="/materials/tests" />;
  if (!isNew && !item) return <LoadingState />;

  return (
    <>
      <PageHead
        sticky
        backHref="/materials/tests"
        backLabel="До тестів"
        title={isNew ? 'Новий тест' : (item?.title ?? '')}
        description={
          !isNew && item ? (
            <MetaBar
              items={[
                { label: 'Оновлено', value: formatDateTime(item.updatedAt) },
                { label: 'Тип', value: KIND_LABELS[item.kind] },
              ]}
            />
          ) : undefined
        }
        actions={
          <>
            <button className="btn" type="submit" form="test-form" disabled={busy || (!isNew && !dirty)}>
              {busy ? 'Збереження…' : isNew ? 'Створити' : 'Зберегти'}
            </button>
            {!isNew && <RecordActionsMenu onDelete={onDelete} />}
          </>
        }
      />

      {!isNew ? (
        <div className="media-type-tabs" role="tablist" aria-label="Розділи тесту">
          {(
            [
              { id: 'settings', label: 'Налаштування' },
              { id: 'questions', label: 'Питання' },
              { id: 'access', label: 'Доступи' },
              { id: 'history', label: 'Історія' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`media-type-tab${tab === t.id ? ' is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <form id="test-form" onSubmit={onSave}>
        <FormAlerts error={error} ok={ok} />

        {(isNew || tab === 'settings') && (
          <div className="panel">
            <div className="panel-head">
              <h3>Налаштування</h3>
            </div>
            <div className="form-box">
              <label htmlFor="test-title">Назва</label>
              <input id="test-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={220} />

              <label htmlFor="test-desc">Опис</label>
              <textarea
                id="test-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />

              <label htmlFor="test-kind">Тип</label>
              <Select
                id="test-kind"
                value={kind}
                onChange={(v) => setKind(v as TestKind)}
                options={[
                  { value: 'free', label: 'Вільний (за посиланням)' },
                  { value: 'material', label: 'Для матеріалу' },
                ]}
              />

              {kind === 'material' ? (
                <>
                  <label htmlFor="test-entity-type">Рівень матеріалу</label>
                  <Select
                    id="test-entity-type"
                    value={entityType}
                    onChange={(v) => {
                      setEntityType(v as ContentEntityType);
                      setEntityId('');
                    }}
                    options={[
                      { value: 'level', label: 'Рівень' },
                      { value: 'course', label: 'Курс' },
                      { value: 'unit', label: 'Юніт' },
                      { value: 'lesson', label: 'Урок' },
                    ]}
                  />
                  <label htmlFor="test-entity-id">Матеріал</label>
                  <Select
                    id="test-entity-id"
                    value={entityId}
                    onChange={setEntityId}
                    placeholder="Оберіть…"
                    searchable
                    options={entityOptions}
                  />
                </>
              ) : null}

              <label htmlFor="test-duration">Вікно доступу після пароля</label>
              <Select
                id="test-duration"
                value={accessDuration}
                onChange={(v) => setAccessDuration(v as TestAccessDuration)}
                options={(Object.keys(DURATION_LABELS) as TestAccessDuration[]).map((key) => ({
                  value: key,
                  label: DURATION_LABELS[key],
                }))}
              />

              <label htmlFor="test-max-attempts">Кількість спроб</label>
              <input
                id="test-max-attempts"
                type="number"
                min={1}
                max={20}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              />
              <p className="muted class-hint">
                За замовчуванням 3. Вчитель або адміністратор може додати учню ще до 5 спроб зверху.
              </p>

              <label htmlFor="test-password">Пароль входу</label>
              <div className="form-inline-row">
                <input
                  id="test-password"
                  value={entryPassword}
                  onChange={(e) => setEntryPassword(e.target.value)}
                  required
                  maxLength={64}
                />
                <button className="btn ghost" type="button" onClick={() => setEntryPassword(randomPassword())}>
                  Згенерувати
                </button>
              </div>

              <label className="form-check">
                <input type="checkbox" checked={randomize} onChange={(e) => setRandomize(e.target.checked)} />
                <span>Рандомізація питань і відповідей</span>
              </label>
            </div>
          </div>
        )}

        {(isNew || tab === 'questions') && (
          <div className="panel" style={{ marginTop: isNew ? '1.1111vw' : 0 }}>
            <div className="panel-head test-q-head">
              <h3>Питання ({questions.length}/100)</h3>
              <button
                className="btn ghost"
                type="button"
                disabled={questions.length >= 100}
                onClick={() => setQuestions((prev) => [...prev, emptyQuestion(prev.length + 1)])}
              >
                <Plus size={14} /> Додати
              </button>
            </div>
            <div className="form-box test-q-list">
              {questions.map((q, qi) => {
                const summary =
                  q.prompt.trim() ||
                  `Питання ${qi + 1} · ${q.options.length} відп.`;
                return (
                  <details key={q.id ?? `q-${qi}`} className="test-acc" open={isNew && qi === 0}>
                    <summary className="test-acc-sum">
                      <span className="test-acc-idx">{qi + 1}</span>
                      <span className="test-acc-title">{summary}</span>
                      <span className="test-acc-meta muted">{q.options.length} відп.</span>
                      <span
                        className="test-acc-actions"
                        onClick={(e) => e.preventDefault()}
                        onKeyDown={(e) => e.preventDefault()}
                      >
                        <button className="test-icon-btn" type="button" onClick={() => moveQuestion(qi, qi - 1)} disabled={qi === 0}>
                          ↑
                        </button>
                        <button
                          className="test-icon-btn"
                          type="button"
                          onClick={() => moveQuestion(qi, qi + 1)}
                          disabled={qi === questions.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          className="test-icon-btn"
                          type="button"
                          disabled={questions.length <= 1}
                          onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    </summary>
                    <div className="test-acc-body">
                      <label>Текст питання</label>
                      <input
                        value={q.prompt}
                        onChange={(e) =>
                          setQuestions((prev) =>
                            prev.map((row, i) => (i === qi ? { ...row, prompt: e.target.value } : row)),
                          )
                        }
                        required
                        maxLength={1000}
                      />
                      <div className="test-opt-toolbar">
                        <span className="muted">Відповіді ({q.options.length}/10)</span>
                        <button
                          className="btn ghost"
                          type="button"
                          disabled={q.options.length >= 10}
                          onClick={() =>
                            setQuestions((prev) =>
                              prev.map((row, i) =>
                                i === qi
                                  ? { ...row, options: [...row.options, emptyOption(row.options.length + 1)] }
                                  : row,
                              ),
                            )
                          }
                        >
                          + Відповідь
                        </button>
                      </div>
                      <div className="test-opt-list">
                        {q.options.map((o, oi) => (
                          <div key={o.id ?? `o-${qi}-${oi}`} className="test-opt-row">
                            <label className="test-opt-check" title="Правильна">
                              <input
                                type="checkbox"
                                checked={o.isCorrect}
                                disabled={o.kind === 'write_in'}
                                onChange={(e) =>
                                  setQuestions((prev) =>
                                    prev.map((row, i) =>
                                      i !== qi
                                        ? row
                                        : {
                                            ...row,
                                            options: row.options.map((opt, j) =>
                                              j === oi ? { ...opt, isCorrect: e.target.checked } : opt,
                                            ),
                                          },
                                    ),
                                  )
                                }
                              />
                            </label>
                            <input
                              value={o.text}
                              placeholder={o.kind === 'write_in' ? 'Еталон (lowercase)' : 'Текст'}
                              onChange={(e) =>
                                setQuestions((prev) =>
                                  prev.map((row, i) =>
                                    i !== qi
                                      ? row
                                      : {
                                          ...row,
                                          options: row.options.map((opt, j) =>
                                            j === oi ? { ...opt, text: e.target.value } : opt,
                                          ),
                                        },
                                  ),
                                )
                              }
                              required
                              maxLength={500}
                            />
                            <Select
                              value={o.kind}
                              onChange={(v) =>
                                setQuestions((prev) =>
                                  prev.map((row, i) =>
                                    i !== qi
                                      ? row
                                      : {
                                          ...row,
                                          options: row.options.map((opt, j) =>
                                            j === oi
                                              ? {
                                                  ...opt,
                                                  kind: v as 'choice' | 'write_in',
                                                  isCorrect: v === 'write_in' ? true : opt.isCorrect,
                                                }
                                              : opt,
                                          ),
                                        },
                                  ),
                                )
                              }
                              options={[
                                { value: 'choice', label: 'Вибір' },
                                { value: 'write_in', label: 'Написати' },
                              ]}
                            />
                            <button
                              className="test-icon-btn"
                              type="button"
                              onClick={() => moveOption(qi, oi, oi - 1)}
                              disabled={oi === 0}
                            >
                              ↑
                            </button>
                            <button
                              className="test-icon-btn"
                              type="button"
                              onClick={() => {
                                if (q.options.length <= 1) return;
                                setQuestions((prev) =>
                                  prev.map((row, i) =>
                                    i === qi ? { ...row, options: row.options.filter((_, j) => j !== oi) } : row,
                                  ),
                                );
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}
      </form>

      {!isNew && tab === 'access' ? <TestAccessPanel testId={Number(id)} kind={kind} /> : null}

      {!isNew && tab === 'history' ? (
        <div className="panel">
          <div className="panel-head">
            <h3>Історія та аналітика</h3>
          </div>
          <div className="form-box">
            {stats ? (
              <div className="test-stats-row">
                <div>
                  <span className="muted">Спроб</span>
                  <b>{stats.totalAttempts}</b>
                </div>
                <div>
                  <span className="muted">Здано</span>
                  <b>{stats.submittedAttempts}</b>
                </div>
                <div>
                  <span className="muted">Унікальних</span>
                  <b>{stats.uniqueUsers}</b>
                </div>
                <div>
                  <span className="muted">Середній</span>
                  <b>{stats.avgScore != null ? `${stats.avgScore}%` : '—'}</b>
                </div>
                <div>
                  <span className="muted">Completion</span>
                  <b>{stats.completionRate}%</b>
                </div>
              </div>
            ) : (
              <LoadingState />
            )}
            <DataTable
              columns={attemptColumns}
              items={attempts}
              rowKey={(row) => row.id}
              onRowClick={(row) => {
                testsApi
                  .attemptDetail(Number(id), row.id)
                  .then(setReview)
                  .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
              }}
              emptyText="Ще немає спроб"
            />

            <div className="panel" style={{ marginTop: 24, boxShadow: 'none', border: 'none', padding: 0 }}>
              <div className="panel-head" style={{ paddingLeft: 0 }}>
                <h3>Додаткові спроби</h3>
              </div>
              <TestAttemptQuotasPanel testId={Number(id)} />
            </div>

            {review ? (
              <div className="test-review">
                <div className="test-review-head">
                  <h4>
                    Розбір #{review.id} · {review.score ?? '—'}%
                  </h4>
                  <button className="btn ghost" type="button" onClick={() => setReview(null)}>
                    Закрити
                  </button>
                </div>
                {review.review.map((q, qi) => (
                  <details key={q.questionId} className="test-acc" open={qi === 0}>
                    <summary className="test-acc-sum">
                      <span className="test-acc-idx">{qi + 1}</span>
                      <span className="test-acc-title">{q.prompt}</span>
                      <span className={`status-pill ${q.isCorrect ? 'status-active' : 'status-review'}`}>
                        {q.isCorrect ? 'Так' : 'Ні'}
                      </span>
                    </summary>
                    <div className="test-acc-body test-review-opts">
                      {q.options.map((o) => (
                        <div
                          key={o.id}
                          className={`test-review-opt${o.isCorrect ? ' is-correct' : ''}${o.selected ? ' is-selected' : ''}`}
                        >
                          <span>{o.kind === 'write_in' ? `Написати: ${o.text}` : o.text}</span>
                          {o.selected ? <em>обрано</em> : null}
                          {o.isCorrect ? <em>вірно</em> : null}
                        </div>
                      ))}
                      {q.writtenText ? <p className="muted">Введено: {q.writtenText}</p> : null}
                    </div>
                  </details>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
