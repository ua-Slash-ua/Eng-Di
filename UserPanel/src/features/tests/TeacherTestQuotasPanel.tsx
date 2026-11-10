'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type QuotaUser = {
  userId: number;
  name: string;
  email: string;
  attemptsUsed: number;
  extraAttempts: number;
  attemptsLimit: number;
  attemptsRemaining: number;
};

type QuotasPayload = {
  maxAttempts: number;
  maxExtraAttempts: number;
  users: QuotaUser[];
};

export function TeacherTestQuotasPanel({ testId }: { testId: number }) {
  const [payload, setPayload] = useState<QuotasPayload | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setPayload(await api<QuotasPayload>(`/api/cabinet/tests/${testId}/quotas`));
  }, [testId]);

  useEffect(() => {
    void load().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити спроби учнів'),
    );
  }, [load]);

  async function onSetExtra(user: QuotaUser, next: number) {
    setBusyId(user.userId);
    setError('');
    setOk('');
    try {
      const clamped = Math.max(0, Math.min(payload?.maxExtraAttempts ?? 5, next));
      await api(`/api/cabinet/tests/${testId}/quotas`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: user.userId, extraAttempts: clamped }),
      });
      await load();
      setOk(`Оновлено спроби для ${user.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="take-test-box teacher-test-quotas">
      <header className="teacher-test-quotas-head">
        <div>
          <p className="teacher-test-quotas-kicker">Керування</p>
          <h2>Спроби учнів</h2>
        </div>
        {payload ? (
          <p className="teacher-test-quotas-hint">
            Базово <b>{payload.maxAttempts}</b>
            {' · '}
            можна додати до <b>+{payload.maxExtraAttempts}</b>
          </p>
        ) : null}
      </header>

      <div className="teacher-test-quotas-body">
        {error ? <p className="error">{error}</p> : null}
        {ok ? <p className="ok">{ok}</p> : null}

        {!payload ? (
          <p className="muted">Завантаження…</p>
        ) : !payload.users.length ? (
          <p className="muted">У вас поки немає учнів.</p>
        ) : (
          <ul className="teacher-test-quotas-list">
            {payload.users.map((user) => {
              const usedPct =
                user.attemptsLimit > 0
                  ? Math.min(100, Math.round((user.attemptsUsed / user.attemptsLimit) * 100))
                  : 0;
              const depleted = user.attemptsRemaining <= 0;
              return (
                <li key={user.userId} className="teacher-test-quotas-row">
                  <div className="teacher-test-quotas-user">
                    <span className="teacher-test-quotas-avatar" aria-hidden>
                      {user.name.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <div className="teacher-test-quotas-copy">
                      <strong>{user.name}</strong>
                      <span className="muted">{user.email}</span>
                      <div className="teacher-test-quotas-meter" aria-hidden>
                        <span style={{ width: `${usedPct}%` }} />
                      </div>
                      <div className="teacher-test-quotas-stats">
                        <span>
                          {user.attemptsUsed}/{user.attemptsLimit}
                        </span>
                        <span className={depleted ? 'is-bad' : ''}>
                          {depleted ? 'вичерпано' : `лишилось ${user.attemptsRemaining}`}
                        </span>
                        {user.extraAttempts > 0 ? (
                          <span className="teacher-test-quotas-bonus">+{user.extraAttempts}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <label className="teacher-test-quotas-control">
                    <span>Додаткові спроби</span>
                    <select
                      value={user.extraAttempts}
                      disabled={busyId === user.userId}
                      onChange={(event) => void onSetExtra(user, Number(event.target.value))}
                    >
                      {Array.from({ length: (payload.maxExtraAttempts ?? 5) + 1 }, (_, i) => (
                        <option key={i} value={i}>
                          +{i}
                        </option>
                      ))}
                    </select>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
