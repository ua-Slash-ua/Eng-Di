'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { TeacherTestQuotasPanel } from './TeacherTestQuotasPanel';

type TestMeta = {
  id: number;
  title: string;
  description: string | null;
  accessDuration: string;
  unlocked: boolean;
  expiresAt: string | null;
  maxAttempts: number;
  attemptsUsed: number;
  extraAttempts: number;
  attemptsLimit: number;
  attemptsRemaining: number;
  canStart: boolean;
  hasInProgress: boolean;
  _count: { questions: number };
};

type AttemptQuestion = {
  id: number;
  prompt: string;
  options: Array<{ id: number; text: string; kind: 'choice' | 'write_in' }>;
};

type ReviewPayload = {
  id: number;
  score: number | null;
  review: Array<{
    questionId: number;
    prompt: string;
    isCorrect: boolean;
    selectedOptionIds: number[];
    writtenText: string | null;
    options: Array<{
      id: number;
      text: string;
      kind: 'choice' | 'write_in';
      isCorrect: boolean;
      selected: boolean;
    }>;
  }>;
};

type AnswersState = Record<number, { selectedOptionIds: number[]; writtenText: string }>;

export function TakeTestView() {
  const params = useParams<{ id: string }>();
  const testId = Number(params?.id);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [meta, setMeta] = useState<TestMeta | null>(null);
  const [password, setPassword] = useState('');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [review, setReview] = useState<ReviewPayload | null>(null);
  const [openQi, setOpenQi] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/materials/tests/${testId}`)}`);
    }
  }, [authLoading, user, router, testId]);

  const loadMeta = useCallback(async () => {
    if (!testId || Number.isNaN(testId)) return;
    const data = await api<TestMeta>(`/api/cabinet/tests/${testId}`);
    setMeta(data);
  }, [testId]);

  useEffect(() => {
    if (!user) return;
    loadMeta().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [user, loadMeta]);

  useEffect(() => {
    if (!meta?.expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [meta?.expiresAt]);

  const remainingMs = useMemo(() => {
    if (!meta?.expiresAt) return null;
    return Math.max(0, new Date(meta.expiresAt).getTime() - now);
  }, [meta?.expiresAt, now]);

  const accessExpired = remainingMs === 0;

  async function onUnlock(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/api/cabinet/tests/${testId}/unlock`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setPassword('');
      await loadMeta();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невірний пароль');
    } finally {
      setBusy(false);
    }
  }

  async function onStart() {
    setBusy(true);
    setError('');
    setReview(null);
    try {
      const data = await api<{ attemptId: number; questions: AttemptQuestion[] }>(
        `/api/cabinet/tests/${testId}/attempts`,
        { method: 'POST' },
      );
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setOpenQi(0);
      const initial: AnswersState = {};
      for (const q of data.questions) {
        initial[q.id] = { selectedOptionIds: [], writtenText: '' };
      }
      setAnswers(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося почати');
      await loadMeta().catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!attemptId) return;
    setBusy(true);
    setError('');
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId: Number(questionId),
          selectedOptionIds: value.selectedOptionIds,
          writtenText: value.writtenText || undefined,
        })),
      };
      const result = await api<ReviewPayload>(`/api/cabinet/tests/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setReview(result);
      setAttemptId(null);
      setQuestions([]);
      setOpenQi(0);
      await loadMeta().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося здати');
      await loadMeta().catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  function formatRemain(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}г ${m % 60}хв`;
    if (m > 0) return `${m}хв ${s % 60}с`;
    return `${s}с`;
  }

  function answeredLabel(q: AttemptQuestion) {
    const state = answers[q.id];
    if (!state) return '—';
    if (state.writtenText.trim()) return 'написано';
    if (state.selectedOptionIds.length) return 'обрано';
    return 'порожньо';
  }

  if (authLoading || !user) {
    return (
      <div className="take-test">
        <p className="muted">Завантаження…</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="take-test">
        {error ? <p className="error">{error}</p> : <p className="muted">Завантаження тесту…</p>}
      </div>
    );
  }

  return (
    <div className="take-test">
      <CabinetPage
        kicker="Тест"
        title={meta.title}
        lead={meta.description ?? undefined}
      >
        <div className="take-test-meta">
          <span>{meta._count.questions} питань</span>
          <span>
            Спроби: {meta.attemptsUsed}/{meta.attemptsLimit}
            {meta.extraAttempts > 0 ? ` (+${meta.extraAttempts})` : ''}
          </span>
          {meta.unlocked && meta.expiresAt ? (
            <span className={accessExpired ? 'is-bad' : ''}>
              {accessExpired ? 'Час вийшов' : `Ще ${formatRemain(remainingMs!)}`}
            </span>
          ) : null}
        </div>

        {error ? <p className="error">{error}</p> : null}

        {user.userRole === 'teacher' ? <TeacherTestQuotasPanel testId={testId} /> : null}

        {review ? (
          <div className="dash-box take-test-box">
            <div className="dash-box-head">
              <h2>Результат · {review.score ?? 0}%</h2>
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  setReview(null);
                  void loadMeta();
                }}
                disabled={!meta.unlocked || accessExpired || !meta.canStart}
              >
                {meta.hasInProgress ? 'Продовжити' : meta.canStart ? 'Ще раз' : 'Спроби вичерпано'}
              </button>
            </div>
            <div className="take-acc-list">
              {review.review.map((q, qi) => (
                <details key={q.questionId} className="take-acc" open={qi === openQi}>
                  <summary
                    className="take-acc-sum"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenQi((cur) => (cur === qi ? -1 : qi));
                    }}
                  >
                    <span className="take-acc-idx">{qi + 1}</span>
                    <span className="take-acc-title">{q.prompt}</span>
                    <span className={`take-pill ${q.isCorrect ? 'ok' : 'bad'}`}>
                      {q.isCorrect ? 'вірно' : 'ні'}
                    </span>
                  </summary>
                  <div className="take-acc-body">
                    {q.options.map((o) => (
                      <div
                        key={o.id}
                        className={`take-opt${o.isCorrect ? ' ok' : ''}${o.selected ? ' pick' : ''}`}
                      >
                        <span>{o.kind === 'write_in' ? `Написати: ${o.text}` : o.text}</span>
                        {o.selected ? <em>ваше</em> : null}
                        {o.isCorrect ? <em>ключ</em> : null}
                      </div>
                    ))}
                    {q.writtenText ? <p className="muted">Введено: {q.writtenText}</p> : null}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ) : !meta.unlocked || accessExpired ? (
          <div className="dash-box take-test-box">
            <div className="dash-box-head">
              <h2>Пароль доступу</h2>
            </div>
            <form className="take-unlock" onSubmit={onUnlock}>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
                placeholder="Введіть пароль тесту"
              />
              <button className="btn" type="submit" disabled={busy}>
                {busy ? '…' : 'Відкрити'}
              </button>
            </form>
          </div>
        ) : !attemptId ? (
          <div className="dash-box take-test-box take-start">
            {meta.canStart ? (
              <>
                <p className="muted">
                  {meta.hasInProgress
                    ? 'У вас є незавершена спроба — можна продовжити.'
                    : `Після старту відповідайте на питання по черзі. Залишилось спроб: ${meta.attemptsRemaining}.`}
                </p>
                <button className="btn" type="button" onClick={onStart} disabled={busy}>
                  {busy ? '…' : meta.hasInProgress ? 'Продовжити тест' : 'Почати тест'}
                </button>
              </>
            ) : (
              <p className="muted">
                Спроби вичерпано ({meta.attemptsUsed} з {meta.attemptsLimit}). Зверніться до вчителя або
                адміністратора, щоб отримати додаткові спроби.
              </p>
            )}
          </div>
        ) : (
          <form className="dash-box take-test-box" onSubmit={onSubmit}>
            <div className="dash-box-head take-test-head">
              <div>
                <p className="take-test-step-label">
                  Питання {openQi + 1} з {questions.length}
                </p>
                <div className="take-progress" aria-hidden>
                  <div
                    className="take-progress-fill"
                    style={{ width: `${((openQi + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
              <button className="btn take-submit-btn" type="submit" disabled={busy}>
                {busy ? '…' : 'Здати'}
              </button>
            </div>

            {questions[openQi] ? (
              <div className="take-question-card">
                <p className="take-question-prompt">{questions[openQi].prompt}</p>
                <div className="take-choices">
                  {questions[openQi].options
                    .filter((o) => o.kind === 'choice')
                    .map((o) => {
                      const state = answers[questions[openQi].id] ?? { selectedOptionIds: [], writtenText: '' };
                      const selected = state.selectedOptionIds.includes(o.id);
                      return (
                        <label key={o.id} className={`take-choice${selected ? ' on' : ''}`}>
                          <input
                            type="radio"
                            name={`q-${questions[openQi].id}`}
                            checked={selected}
                            onChange={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [questions[openQi].id]: { selectedOptionIds: [o.id], writtenText: '' },
                              }))
                            }
                          />
                          <span className="take-choice-text">{o.text}</span>
                        </label>
                      );
                    })}
                </div>
                {questions[openQi].options.some((o) => o.kind === 'write_in') ? (
                  <input
                    className="take-write"
                    value={answers[questions[openQi].id]?.writtenText ?? ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [questions[openQi].id]: { selectedOptionIds: [], writtenText: e.target.value },
                      }))
                    }
                    placeholder="Своя відповідь…"
                  />
                ) : null}
                <div className="take-nav">
                  <button
                    className="btn ghost take-nav-btn"
                    type="button"
                    disabled={openQi === 0}
                    onClick={() => setOpenQi(openQi - 1)}
                  >
                    Назад
                  </button>
                  <button
                    className="btn ghost take-nav-btn"
                    type="button"
                    disabled={openQi >= questions.length - 1}
                    onClick={() => setOpenQi(openQi + 1)}
                  >
                    Далі
                  </button>
                </div>
              </div>
            ) : null}

            <div className="take-steps" aria-label="Список питань">
              {questions.map((q, qi) => {
                const label = answeredLabel(q);
                const done = label !== 'порожньо' && label !== '—';
                return (
                  <button
                    key={q.id}
                    type="button"
                    className={`take-step${qi === openQi ? ' on' : ''}${done ? ' done' : ''}`}
                    onClick={() => setOpenQi(qi)}
                    aria-current={qi === openQi ? 'step' : undefined}
                    title={q.prompt}
                  >
                    {qi + 1}
                  </button>
                );
              })}
            </div>
          </form>
        )}
      </CabinetPage>
    </div>
  );
}
