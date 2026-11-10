'use client';

import { useEffect, useState } from 'react';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { LessonRow } from './LessonRow';
import { LessonSlotModal } from './LessonSlotModal';
import { cabinetLessonsApi, studentLessonPath, type CabinetLesson, type LessonsBoard } from './api';
import { freezeCountLabel, lessonLabel, lessonWhen } from './labels';

export function StudentLessonsView() {
  const [data, setData] = useState<Extract<LessonsBoard, { role: 'student' }> | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState<number | null>(null);
  const [freezing, setFreezing] = useState<CabinetLesson | null>(null);

  function apply(next: LessonsBoard) {
    if (next.role !== 'student') {
      setError('Ця сторінка лише для учня');
      return;
    }
    setData(next);
  }

  useEffect(() => {
    cabinetLessonsApi
      .board()
      .then(apply)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, []);

  async function run(action: () => Promise<LessonsBoard>, done: string) {
    setError('');
    setOk('');
    setBusy(true);
    try {
      apply(await action());
      setOk(done);
      setPicking(null);
      setFreezing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setBusy(false);
    }
  }

  if (!data && !error) {
    return (
      <CabinetPage title="Заняття" lead="Учитель пропонує час. Ви підтверджуєте, відхиляєте або пропонуєте інший.">
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  const current = data?.current;
  const waiting =
    data?.upcoming.filter(
      (row) => (row.status === 'proposed' || row.status === 'rescheduling') && row.waitingOn === 'student',
    ) ?? [];
  const pending =
    data?.upcoming.filter(
      (row) => (row.status === 'proposed' || row.status === 'rescheduling') && row.waitingOn === 'teacher',
    ) ?? [];
  const confirmed = data?.upcoming.filter((row) => row.status === 'confirmed') ?? [];
  const frozen = data?.frozen ?? [];
  const done = data?.done ?? [];
  const missed = data?.missed ?? [];
  const adminSkip = data?.adminSkip ?? [];

  function freezeLesson(id: number) {
    const freeze = data?.freeze;
    if (!freeze?.perMonth) {
      setOk('');
      setError('У цьому тарифі заморозки вимкнені. В адмінці відкрийте тариф → Умови і вкажіть кількість «Заморозок на місяць».');
      return;
    }
    if (!freeze.left) {
      setOk('');
      setError(`Цього місяця заморозки вже використано (${freeze.used} з ${freeze.perMonth}).`);
      return;
    }
    const row = confirmed.find((item) => item.id === id);
    if (!row) return;
    setError('');
    setOk('');
    setFreezing(row);
  }

  return (
    <CabinetPage title="Заняття" lead="Учитель пропонує час. Ви підтверджуєте, відхиляєте або пропонуєте інший.">
      {error ? <p className="error">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
      {!current ? (
        <article className="cabinet-banner is-empty">
          <div>
            <p className="cabinet-banner-label">Немає активного тарифу</p>
            <p className="cabinet-banner-title">Спочатку оберіть пакет у тарифах</p>
          </div>
          <a className="btn" href="/cabinet/student/tariffs">
            До тарифів
          </a>
        </article>
      ) : (
        <>
          <article className="my-tariff is-current">
            <div>
              <p className="cabinet-banner-label">Доступно зараз</p>
              <h2>
                {current.availableLessons} з {current.totalLessons} уроків
              </h2>
              <p className="muted">{current.title}</p>
              <p className="muted">
                {data.freeze?.perMonth
                  ? `Заморозки цього місяця: ${data.freeze.used} з ${data.freeze.perMonth}`
                  : 'У тарифі немає заморозок — пропуск з поверненням коштів вимкнено.'}
              </p>
            </div>
          </article>
          {waiting.length ? (
            <section className="card lesson-panel">
              <h2>Потрібна відповідь</h2>
              <p className="muted">Підтвердіть слот, відхиліть / залиште попередній час або запропонуйте інший.</p>
              <ul className="lesson-list">
                {waiting.map((row) => (
                  <LessonRow
                    key={row.id}
                    row={row}
                    me="student"
                    busy={busy}
                    detailHref={row.status === 'rescheduling' ? studentLessonPath(row.id) : undefined}
                    onPropose={setPicking}
                    onAccept={(id) => void run(() => cabinetLessonsApi.accept(id), 'Час підтверджено')}
                    onDecline={(id) =>
                      void run(
                        () => cabinetLessonsApi.decline(id),
                        row.status === 'rescheduling' ? 'Залишено попередній час' : 'Пропозицію відхилено',
                      )
                    }
                  />
                ))}
              </ul>
            </section>
          ) : null}
          <section className="card lesson-panel">
            <h2>Не назначені</h2>
            <p className="muted">Чекають першої пропозиції від учителя.</p>
            {data.unscheduled.length ? (
              <ul className="lesson-list">
                {data.unscheduled.map((row) => (
                  <LessonRow key={row.id} row={row} me="student" busy={busy} />
                ))}
              </ul>
            ) : (
              <div className="cal-empty">Немає уроків без дати.</div>
            )}
          </section>
          {pending.length ? (
            <section className="card lesson-panel">
              <h2>Чекаємо вчителя</h2>
              <p className="muted">Ви запропонували інший час або перенесення.</p>
              <ul className="lesson-list">
                {pending.map((row) => (
                  <LessonRow
                    key={row.id}
                    row={row}
                    me="student"
                    busy={busy}
                    detailHref={row.status === 'rescheduling' ? studentLessonPath(row.id) : undefined}
                  />
                ))}
              </ul>
            </section>
          ) : null}
          {confirmed.length ? (
            <section className="card lesson-panel">
              <h2>Очікують проведення</h2>
              <p className="muted">
                Можна перенести час (матеріали залишаться).{' '}
                {!data.freeze?.perMonth
                  ? 'У цьому тарифі заморозки вимкнені. Увімкніть їх в адмінці: тариф → Умови → Заморозок на місяць.'
                  : !data.freeze.left
                    ? `Цього місяця заморозки вже використано (${data.freeze.used} з ${data.freeze.perMonth}).`
                    : `Якщо не зможете бути на уроці, його можна заморозити — кошти повернуть. Залишилось ${freezeCountLabel(data.freeze.left)}.`}
              </p>
              <ul className="lesson-list">
                {confirmed.map((row) => (
                  <LessonRow
                    key={row.id}
                    row={row}
                    me="student"
                    busy={busy}
                    detailHref={studentLessonPath(row.id)}
                    onPropose={setPicking}
                    onFreeze={freezeLesson}
                  />
                ))}
              </ul>
            </section>
          ) : null}
          {frozen.length ? (
            <section className="card lesson-panel">
              <h2>Заморожені</h2>
              <p className="muted">Пропущені уроки. Коли кошти повернуть, статус оновиться.</p>
              <ul className="lesson-list">
                {frozen.map((row) => (
                  <LessonRow key={row.id} row={row} me="student" busy={busy} />
                ))}
              </ul>
            </section>
          ) : null}
          {done.length ? (
            <section className="card lesson-panel">
              <h2>Виконані</h2>
              <p className="muted">Уроки, які вчитель позначив як проведені.</p>
              <ul className="lesson-list">
                {done.map((row) => (
                  <LessonRow key={row.id} row={row} me="student" busy={busy} href={studentLessonPath(row.id)} />
                ))}
              </ul>
            </section>
          ) : null}
          {missed.length ? (
            <section className="card lesson-panel">
              <h2>Пропущені без причини</h2>
              <p className="muted">Вчитель позначив, що урок пропущено без поважної причини.</p>
              <ul className="lesson-list">
                {missed.map((row) => (
                  <LessonRow key={row.id} row={row} me="student" busy={busy} />
                ))}
              </ul>
            </section>
          ) : null}
          {adminSkip.length ? (
            <section className="card lesson-panel">
              <h2>Пропуск адміністрації</h2>
              <p className="muted">Адміністратор закрив урок через поважну причину, коли заморозки вже використано.</p>
              <ul className="lesson-list">
                {adminSkip.map((row) => (
                  <LessonRow key={row.id} row={row} me="student" busy={busy} />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
      {picking != null ? (
        <LessonSlotModal
          lessonId={picking}
          title={
            data?.upcoming.find((row) => row.id === picking)?.status === 'confirmed'
              ? 'Перенести урок'
              : 'Запропонувати інший час'
          }
          onClose={() => setPicking(null)}
          onPicked={(date, hour, minute) =>
            run(
              () => cabinetLessonsApi.propose(picking, date, hour, minute ?? 0),
              'Інший час надіслано вчителю',
            )
          }
        />
      ) : null}
      {freezing ? (
        <div className="cabinet-modal-backdrop" onClick={() => setFreezing(null)} role="presentation">
          <div className="cabinet-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="cabinet-modal-body">
              <h3>Заморозити урок?</h3>
              <p>
                {lessonLabel(freezing)}
                {lessonWhen(freezing) ? ` · ${lessonWhen(freezing)}` : ''} зніметься з розкладу, а кошти за нього повернуть.
              </p>
              <p className="muted">
                Цього місяця ще можна використати {freezeCountLabel(data?.freeze?.left ?? 0)}.
              </p>
            </div>
            <div className="cabinet-modal-actions">
              <button className="btn ghost" type="button" disabled={busy} onClick={() => setFreezing(null)}>
                Скасувати
              </button>
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() => void run(() => cabinetLessonsApi.freeze(freezing.id), 'Урок заморожено')}
              >
                {busy ? 'Заморозка…' : 'Заморозити'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </CabinetPage>
  );
}
