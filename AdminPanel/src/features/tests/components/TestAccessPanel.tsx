'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { MultiSelect } from '@/components/fields/MultiSelect';
import { initials } from '@/lib/format';
import { usersApi } from '@/features/users/api';
import type { UserBrief } from '@/features/users/types';
import { testsApi, type TestAccessGrant } from '../api';

const ROLE_LABEL: Record<string, string> = {
  student: 'Учень',
  teacher: 'Вчитель',
};

type DirUser = UserBrief & { userRole: 'student' | 'teacher' };

export function TestAccessPanel({ testId, kind }: { testId: number; kind: string }) {
  const [grants, setGrants] = useState<TestAccessGrant[]>([]);
  const [directory, setDirectory] = useState<DirUser[]>([]);
  const [pick, setPick] = useState<number[]>([]);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (kind !== 'free') return;
    setError('');
    testsApi
      .grants(testId)
      .then(setGrants)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Не вдалося завантажити доступи'));
    Promise.all([usersApi.directory('teacher'), usersApi.directory('student')])
      .then(([teachers, students]) => {
        setDirectory([
          ...teachers.users.map((row) => ({ ...row, userRole: 'teacher' as const })),
          ...students.users.map((row) => ({ ...row, userRole: 'student' as const })),
        ]);
      })
      .catch(() => setDirectory([]));
  }, [testId, kind]);

  const assignedIds = useMemo(() => new Set(grants.map((row) => row.user.id)), [grants]);

  const addOptions = useMemo(
    () =>
      directory
        .filter((row) => !assignedIds.has(row.id) && row.status === 'active')
        .map((row) => ({
          id: row.id,
          title: row.name || row.email,
          subtitle: `${ROLE_LABEL[row.userRole] ?? row.userRole} · ${row.email}`,
        })),
    [assignedIds, directory],
  );

  const visibleGrants = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return grants;
    return grants.filter((row) => {
      const hay = `${row.user.name} ${row.user.email} ${row.user.userRole ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filter, grants]);

  async function run(fn: () => Promise<TestAccessGrant[]>, success: string) {
    setBusy(true);
    setError('');
    setOk('');
    try {
      setGrants(await fn());
      setPick([]);
      setOk(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  if (kind !== 'free') {
    return (
      <div className="panel">
        <div className="panel-head">
          <h3>Доступи</h3>
        </div>
        <div className="access-tab-body">
          <p className="muted">
            Цей тест привʼязаний до матеріалу. Доступ відкривається автоматично тим, хто має доступ до
            відповідного уроку / курсу.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Доступи</h3>
      </div>
      <div className="access-tab-body">
        <FormAlerts error={error} ok={ok} />
        <p className="muted class-hint">
          Вільний тест можна присвоїти кільком учням і вчителям одразу. Після цього вони бачать його в
          кабінеті без пароля (доступ безстроковий, поки не знімете).
        </p>
        <div className="class-add is-stack">
          <MultiSelect
            title="Користувачі"
            hint="Можна обрати кількох — з пошуком"
            placeholder={addOptions.length ? 'Обрати учнів і вчителів' : 'Немає кого додати'}
            emptyText="Нікого не знайдено"
            options={addOptions}
            value={pick}
            onChange={setPick}
            searchable
          />
          <button
            className="btn"
            type="button"
            disabled={busy || !pick.length}
            onClick={() =>
              void run(
                () => testsApi.grantMany(testId, pick),
                pick.length === 1 ? 'Доступ видано' : `Доступ видано: ${pick.length}`,
              )
            }
          >
            Додати{pick.length > 1 ? ` (${pick.length})` : ''}
          </button>
        </div>
        {grants.length ? (
          <>
            <label htmlFor="test-access-filter">Пошук у списку</label>
            <input
              id="test-access-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Імʼя або email"
            />
            <ul className="class-people">
              {visibleGrants.map((row) => (
                <li key={row.id}>
                  <Link href={`/users/${row.user.id}`} className="class-person">
                    <span className="mini-av">{initials(row.user.name, row.user.email)}</span>
                    <span>
                      <b>{row.user.name || 'Без імені'}</b>
                      <span className="muted">
                        {ROLE_LABEL[row.user.userRole ?? ''] ?? row.user.userRole ?? '—'} · {row.user.email}
                      </span>
                    </span>
                  </Link>
                  <button
                    className="btn ghost"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(() => testsApi.revokeGrant(testId, row.id), 'Доступ знято')
                    }
                  >
                    Зняти
                  </button>
                </li>
              ))}
            </ul>
            {!visibleGrants.length ? <p className="muted">Нічого не знайдено за запитом.</p> : null}
          </>
        ) : (
          <p className="muted">Ще нікому не присвоєно.</p>
        )}
      </div>
    </div>
  );
}
