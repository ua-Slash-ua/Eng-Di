'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { Select } from '@/components/ui/Select';
import { initials } from '@/lib/format';
import { usersApi } from '../api';
import type { User, UserBrief, UserClassResponse, UserPanelRole } from '../types';

export function UserClassPanel({ item }: { item: User }) {
  const [data, setData] = useState<UserClassResponse | null>(null);
  const [directory, setDirectory] = useState<UserBrief[]>([]);
  const [pick, setPick] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [pendingStudent, setPendingStudent] = useState<UserBrief | null>(null);

  const role = item.userRole;
  const directoryRole: UserPanelRole | null = role === 'teacher' ? 'student' : role === 'student' ? 'teacher' : null;

  useEffect(() => {
    if (!directoryRole) return;
    setError('');
    usersApi.classOf(item.id).then(setData).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити клас');
    });
    usersApi
      .directory(directoryRole)
      .then((payload) => setDirectory(payload.users))
      .catch(() => setDirectory([]));
  }, [item.id, directoryRole]);

  const assignedIds = useMemo(() => new Set((data?.students ?? []).map((row) => row.id)), [data]);
  const addOptions = useMemo(
    () =>
      directory
        .filter((row) => row.id !== item.id && !assignedIds.has(row.id))
        .map((row) => ({
          value: String(row.id),
          label: row.name || row.email,
          hint: row.teacher ? `${row.email} · зараз у ${row.teacher.name}` : row.email,
        })),
    [assignedIds, directory, item.id],
  );

  async function run(fn: () => Promise<UserClassResponse>, success: string) {
    setBusy(true);
    setError('');
    setOk('');
    try {
      setData(await fn());
      setPick('');
      setOk(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  function requestAdd() {
    const student = directory.find((row) => String(row.id) === pick);
    if (!student) return;
    if (student.teacher && student.teacher.id !== item.id) {
      setPendingStudent(student);
      return;
    }
    void run(() => usersApi.addStudent(item.id, student.id), 'Учня додано');
  }

  if (!role) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h3>Клас</h3>
        </div>
        <div className="access-tab-body">
          <p className="muted">Спочатку оберіть доступ до кабінету: учень або вчитель.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel class-tab">
      <div className="panel-head">
        <h3>{role === 'teacher' ? 'Учні' : 'Вчитель'}</h3>
      </div>
      <div className="access-tab-body">
        <FormAlerts error={error} ok={ok} />
        {role === 'student' ? (
          <>
            <p className="muted class-hint">Учень може мати лише одного вчителя.</p>
            <label htmlFor="class-teacher">Вчитель</label>
            <Select
              id="class-teacher"
              value={data?.teacher ? String(data.teacher.id) : ''}
              disabled={busy || !data}
              placeholder="Без вчителя"
              options={[
                { value: '', label: 'Без вчителя' },
                ...directory.map((row) => ({
                  value: String(row.id),
                  label: row.name || row.email,
                  hint: row.email,
                })),
              ]}
              onChange={(value) => {
                void run(
                  () => usersApi.setTeacher(item.id, value ? Number(value) : null),
                  value ? 'Вчителя призначено' : 'Вчителя знято',
                );
              }}
            />
            {data?.teacher ? (
              <Link href={`/users/${data.teacher.id}`} className="class-person">
                <span className="mini-av">{initials(data.teacher.name, data.teacher.email)}</span>
                <span>
                  <b>{data.teacher.name || 'Без імені'}</b>
                  <span className="muted">{data.teacher.email}</span>
                </span>
              </Link>
            ) : (
              <p className="muted">Вчителя ще не призначено.</p>
            )}
          </>
        ) : (
          <>
            <p className="muted class-hint">
              Можна додати кількох учнів. Якщо учень уже має вчителя — його буде переведено сюди.
            </p>
            <div className="class-add">
              <Select
                id="class-student"
                value={pick}
                disabled={busy}
                placeholder={addOptions.length ? 'Оберіть учня' : 'Немає учнів для додавання'}
                options={addOptions}
                onChange={setPick}
              />
              <button className="btn" type="button" disabled={busy || !pick} onClick={requestAdd}>
                Додати
              </button>
            </div>
            {data?.students.length ? (
              <ul className="class-people">
                {data.students.map((student) => (
                  <li key={student.id}>
                    <Link href={`/users/${student.id}`} className="class-person">
                      <span className="mini-av">{initials(student.name, student.email)}</span>
                      <span>
                        <b>{student.name || 'Без імені'}</b>
                        <span className="muted">{student.email}</span>
                      </span>
                    </Link>
                    <button
                      className="btn-outline"
                      type="button"
                      disabled={busy}
                      onClick={() => void run(() => usersApi.removeStudent(item.id, student.id), 'Учня знято')}
                    >
                      Зняти
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">{data ? 'Учнів ще немає.' : 'Завантаження…'}</p>
            )}
          </>
        )}
      </div>
      <ConfirmModal
        open={Boolean(pendingStudent)}
        title="Перевести учня"
        description={
          pendingStudent?.teacher
            ? `«${pendingStudent.name || pendingStudent.email}» зараз у вчителя ${pendingStudent.teacher.name}. Перевести сюди?`
            : ''
        }
        confirmLabel="Перевести"
        busy={busy}
        error={error}
        onConfirm={() => {
          if (!pendingStudent) return;
          const studentId = pendingStudent.id;
          setPendingStudent(null);
          void run(() => usersApi.addStudent(item.id, studentId), 'Учня переведено');
        }}
        onClose={() => {
          if (busy) return;
          setPendingStudent(null);
        }}
      />
    </div>
  );
}
