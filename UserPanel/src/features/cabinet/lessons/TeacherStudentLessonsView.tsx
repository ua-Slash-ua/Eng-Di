'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { CabinetBackRow } from '@/features/cabinet/CabinetBackRow';
import { LessonTile } from './LessonTile';
import { cabinetLessonsApi, teacherLessonPath, type CabinetLesson, type TeacherLessonGroup } from './api';
import { lessonWhen, nextConfirmed, splitLessonPack } from './labels';

function Group({
  title,
  rows,
  studentId,
  nextId,
}: {
  title: string;
  rows: CabinetLesson[];
  studentId: number;
  nextId?: number;
}) {
  if (!rows.length) return null;
  return (
    <section className="lesson-board-group">
      <h3 className="lesson-sub">
        {title} <span className="student-roll-count">{rows.length}</span>
      </h3>
      <div className="lesson-mosaic">
        {rows.map((row) => (
          <LessonTile
            key={row.id}
            row={row}
            href={teacherLessonPath(studentId, row.id)}
            highlight={row.id === nextId}
          />
        ))}
      </div>
    </section>
  );
}

export function TeacherStudentLessonsView() {
  const params = useParams<{ studentId: string }>();
  const studentId = Number(params?.studentId);
  const [data, setData] = useState<TeacherLessonGroup | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!Number.isInteger(studentId) || studentId < 1) {
      setError('Учня не знайдено');
      return;
    }
    cabinetLessonsApi
      .student(studentId)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [studentId]);

  if (!data && !error) {
    return (
      <CabinetPage kicker="Заняття" title="Учень">
        <CabinetBackRow parentHref="/cabinet/teacher/lessons" parentLabel="До учнів" />
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  const parts = data ? splitLessonPack(data) : null;
  const next = parts ? nextConfirmed(parts.confirmed) : undefined;
  const empty =
    parts &&
    !parts.waiting.length &&
    !parts.confirmed.length &&
    !parts.unscheduled.length &&
    !parts.frozen.length &&
    !parts.done.length &&
    !parts.missed.length &&
    !parts.adminSkip.length;

  return (
    <CabinetPage
      kicker="Заняття"
      title={data?.student.name || 'Учень'}
      lead={data?.student.email}
    >
      <CabinetBackRow parentHref="/cabinet/teacher/lessons" parentLabel="До учнів" />
      {error ? <p className="error">{error}</p> : null}
      {data && parts ? (
        <div className="lesson-student-page">
          <div className="lesson-board">
            <Group title="Очікують узгодження" rows={parts.waiting} studentId={data.student.id} nextId={next?.id} />
            <Group title="Очікують проведення" rows={parts.confirmed} studentId={data.student.id} nextId={next?.id} />
            <Group title="Не назначені" rows={parts.unscheduled} studentId={data.student.id} />
            <Group title="Заморожені" rows={parts.frozen} studentId={data.student.id} />
            <Group title="Виконані" rows={parts.done} studentId={data.student.id} />
            <Group title="Пропущені без причини" rows={parts.missed} studentId={data.student.id} />
            <Group title="Пропуск адміністрації" rows={parts.adminSkip} studentId={data.student.id} />
            {empty ? (
              <div className="cal-empty">
                {data.current ? 'Немає уроків у цьому тарифі.' : 'Коли з’явиться оплата, уроки будуть тут.'}
              </div>
            ) : null}
          </div>
          <aside className="lesson-side">
            <article className="student-pass">
              <header className="lesson-sheet-head">
                <div>
                  <p className="cabinet-banner-label">Наступний урок</p>
                  <h2>{next && lessonWhen(next) ? lessonWhen(next) : 'Немає підтвердженого слота'}</h2>
                  {next ? <p className="muted">Урок {next.number}</p> : <p className="muted">{data.student.email}</p>}
                </div>
                {data.current ? (
                  <span className="cal-chip is-daily">{parts.unscheduled.length} не назначено</span>
                ) : (
                  <span className="cal-chip is-off">Немає тарифу</span>
                )}
              </header>
              <dl className="student-pass-facts">
                <div>
                  <dt>Тариф</dt>
                  <dd>{data.current?.title || 'Немає'}</dd>
                </div>
                <div>
                  <dt>Уроки</dt>
                  <dd>
                    {data.current
                      ? `${data.current.availableLessons} / ${data.current.totalLessons}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>До</dt>
                  <dd>
                    {data.current ? new Date(data.current.endsAt).toLocaleDateString('uk-UA') : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Телефон</dt>
                  <dd>
                    {data.student.phone ? (
                      <a href={`tel:${data.student.phone}`}>{data.student.phone}</a>
                    ) : (
                      'Не вказано'
                    )}
                  </dd>
                </div>
              </dl>
              {next ? (
                <div className="lesson-sheet-foot">
                  <Link href={teacherLessonPath(data.student.id, next.id)} className="btn">
                    Відкрити урок {next.number}
                  </Link>
                </div>
              ) : null}
            </article>
          </aside>
        </div>
      ) : null}
    </CabinetPage>
  );
}
