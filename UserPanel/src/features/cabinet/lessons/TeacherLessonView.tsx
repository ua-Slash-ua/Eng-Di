'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { CabinetBackRow } from '@/features/cabinet/CabinetBackRow';
import { LessonMaterialAssignPanel, canAssignLessonMaterial } from './LessonMaterialAssignPanel';
import { LessonMaterialPanel } from './LessonMaterialPanel';
import { LinkedTestsPanel } from '@/features/tests/LinkedTestsPanel';
import { LessonSlotModal } from './LessonSlotModal';
import {
  cabinetLessonsApi,
  teacherStudentPath,
  type CabinetLesson,
  type CabinetLessonCard,
} from './api';
import { lessonChip, lessonHint, lessonLabel, lessonState, lessonWhen } from './labels';

export function TeacherLessonView() {
  const params = useParams<{ studentId: string; lessonId: string }>();
  const studentId = Number(params?.studentId);
  const lessonId = Number(params?.lessonId);
  const [data, setData] = useState<CabinetLessonCard | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [missing, setMissing] = useState<CabinetLesson | null>(null);

  function load() {
    return cabinetLessonsApi.show(lessonId).then(setData);
  }

  useEffect(() => {
    if (!Number.isInteger(lessonId) || lessonId < 1) {
      setError('Урок не знайдено');
      return;
    }
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [lessonId]);

  async function run(action: () => Promise<unknown>, done: string) {
    setError('');
    setOk('');
    setBusy(true);
    try {
      await action();
      await load();
      setOk(done);
      setPicking(false);
      setMissing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setBusy(false);
    }
  }

  const row = data?.lesson;
  const student = data?.student;
  const backHref = teacherStudentPath(student?.id || studentId);

  if (!data && !error) {
    return (
      <CabinetPage title="Урок" lead="Картка заняття.">
        <CabinetBackRow parentHref={backHref} parentLabel="До уроків" />
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  const hint = row ? lessonHint(row, 'teacher') : '';
  const assignMaterial = row ? canAssignLessonMaterial(row.status) : false;
  const canAct =
    row &&
    (row.status === 'unscheduled' ||
      ((row.status === 'proposed' || row.status === 'rescheduling') && row.waitingOn === 'teacher') ||
      row.status === 'confirmed');

  return (
    <CabinetPage
      kicker="Заняття"
      title={row ? lessonLabel(row) : 'Урок'}
      lead={student?.name}
    >
      <CabinetBackRow parentHref={backHref} parentLabel="До уроків" />
      {error ? <p className="error">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
      {row && student ? (
        <div className="lesson-student-page">
          <div className="lesson-student-main">
            {assignMaterial ? (
              <LessonMaterialAssignPanel
                lessonId={row.id}
                material={data.material}
                onUpdated={load}
                disabled={busy}
              />
            ) : data?.material ? (
              <LessonMaterialPanel
                title={data.material.title}
                description={data.material.description}
                presentation={data.material.presentation}
              />
            ) : null}
            {data?.linkedTests?.length ? (
              <LinkedTestsPanel tests={data.linkedTests} showPassword />
            ) : null}
            {canAct ? (
              <div className="lesson-work">
                {hint ? <p className="lesson-work-note">{hint}</p> : null}
                <div className="lesson-detail-actions">
                  {row.status === 'unscheduled' ? (
                    <button className="btn" type="button" disabled={busy} onClick={() => setPicking(true)}>
                      Запропонувати час
                    </button>
                  ) : null}
                  {(row.status === 'proposed' || row.status === 'rescheduling') && row.waitingOn === 'teacher' ? (
                    <>
                      <button
                        className="btn"
                        type="button"
                        disabled={busy}
                        onClick={() => void run(() => cabinetLessonsApi.accept(row.id), 'Час підтверджено')}
                      >
                        Підтвердити
                      </button>
                      <button
                        className="btn ghost"
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => cabinetLessonsApi.decline(row.id),
                            row.status === 'rescheduling' ? 'Залишено попередній час' : 'Пропозицію відхилено',
                          )
                        }
                      >
                        {row.status === 'rescheduling' ? 'Залишити старий час' : 'Відхилити'}
                      </button>
                      <button className="btn ghost" type="button" disabled={busy} onClick={() => setPicking(true)}>
                        Інший час
                      </button>
                    </>
                  ) : null}
                  {row.status === 'confirmed' ? (
                    <>
                      <button className="btn ghost" type="button" disabled={busy} onClick={() => setPicking(true)}>
                        Перенести
                      </button>
                      <button
                        className="btn"
                        type="button"
                        disabled={busy}
                        onClick={() => void run(() => cabinetLessonsApi.complete(row.id), 'Урок позначено як виконаний')}
                      >
                        Виконано
                      </button>
                      <button className="btn ghost" type="button" disabled={busy} onClick={() => setMissing(row)}>
                        Пропущено
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          <aside className="lesson-side">
            <article className="student-pass">
              <header className="lesson-sheet-head">
                <div>
                  <p className="cabinet-banner-label">Коли</p>
                  <h2>{lessonWhen(row) || 'Дату ще не назначено'}</h2>
                  <p className="muted">{student.name}</p>
                </div>
                <span className={`cal-chip ${lessonChip(row, 'teacher')}`}>{lessonState(row, 'teacher')}</span>
              </header>
              {hint && !canAct ? <p className="lesson-side-note">{hint}</p> : null}
              <dl className="student-pass-facts">
                <div>
                  <dt>Учень</dt>
                  <dd>{student.name}</dd>
                </div>
                <div>
                  <dt>Тариф</dt>
                  <dd>{row.tariffTitle}</dd>
                </div>
                <div>
                  <dt>Пошта</dt>
                  <dd>
                    <a href={`mailto:${student.email}`}>{student.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Телефон</dt>
                  <dd>
                    {student.phone ? <a href={`tel:${student.phone}`}>{student.phone}</a> : 'Не вказано'}
                  </dd>
                </div>
                {row.status === 'frozen' && row.refundAmount ? (
                  <div>
                    <dt>До повернення</dt>
                    <dd>{row.refundAmount} грн</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          </aside>
        </div>
      ) : null}
      {picking && row ? (
        <LessonSlotModal
          lessonId={row.id}
          title={
            row.status === 'unscheduled'
              ? 'Запропонувати час'
              : row.status === 'confirmed'
                ? 'Перенести урок'
                : 'Інший час'
          }
          onClose={() => setPicking(false)}
          onPicked={(date, hour, minute) =>
            run(
              () => cabinetLessonsApi.propose(row.id, date, hour, minute ?? 0),
              row.status === 'confirmed' ? 'Запит на перенесення надіслано' : 'Пропозицію надіслано учню',
            )
          }
        />
      ) : null}
      {missing ? (
        <div className="cabinet-modal-backdrop" onClick={() => setMissing(null)} role="presentation">
          <div className="cabinet-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="cabinet-modal-body">
              <h3>Учень пропустив урок?</h3>
              <p>
                {lessonLabel(missing)}
                {lessonWhen(missing) ? ` · ${lessonWhen(missing)}` : ''} буде позначено як пропущений без поважної причини.
              </p>
              <p className="muted">Кошти за цей урок не повертаються. Якщо є поважна причина — зверніться до адміністратора.</p>
            </div>
            <div className="cabinet-modal-actions">
              <button className="btn ghost" type="button" disabled={busy} onClick={() => setMissing(null)}>
                Скасувати
              </button>
              <button
                className="btn"
                type="button"
                disabled={busy}
                onClick={() => void run(() => cabinetLessonsApi.miss(missing.id), 'Урок позначено як пропущений')}
              >
                {busy ? 'Збереження…' : 'Пропущено'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </CabinetPage>
  );
}
