'use client';

import { useCallback, useEffect, useState } from 'react';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { testsApi } from '../api';
import type { TestAttemptQuotaUser, TestAttemptQuotasPayload } from '../types';

export function TestAttemptQuotasPanel({ testId }: { testId: number }) {
  const [payload, setPayload] = useState<TestAttemptQuotasPayload | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError('');
    setPayload(await testsApi.quotas(testId));
  }, [testId]);

  useEffect(() => {
    void load().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити спроби'),
    );
  }, [load]);

  async function onSetExtra(user: TestAttemptQuotaUser, next: number) {
    setBusyId(user.userId);
    setError('');
    setOk('');
    try {
      const clamped = Math.max(0, Math.min(payload?.maxExtraAttempts ?? 5, next));
      await testsApi.setQuota(testId, user.userId, clamped);
      await load();
      setOk(`Оновлено додаткові спроби для ${user.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="test-quotas">
      <FormAlerts error={error} ok={ok} />
      {!payload ? (
        <p className="muted">Завантаження…</p>
      ) : (
        <>
          <p className="muted class-hint">
            Базовий ліміт тесту — {payload.maxAttempts}. Можна додати користувачу ще до{' '}
            {payload.maxExtraAttempts} спроб зверху.
          </p>
          {!payload.users.length ? (
            <p className="muted">Поки немає користувачів зі спробами.</p>
          ) : (
            <div className="test-quotas-list">
              {payload.users.map((user) => (
                <div key={user.userId} className="test-quotas-row">
                  <div>
                    <strong>{user.name}</strong>
                    <div className="muted">{user.email}</div>
                    <div className="muted">
                      Використано {user.attemptsUsed} з {user.attemptsLimit} · залишилось{' '}
                      {user.attemptsRemaining}
                    </div>
                  </div>
                  <label className="test-quotas-extra">
                    <span>Додаткові</span>
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
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
