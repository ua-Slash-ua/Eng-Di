'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { cabinetLessonsApi, teacherStudentPath, type LessonsBoard } from './api';
import { lessonClock, lessonDayShort, lessonWhen, nextConfirmed, personInitials, splitLessonPack } from './labels';

export function TeacherLessonsView() {
  const [data, setData] = useState<Extract<LessonsBoard, { role: 'teacher' }> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    cabinetLessonsApi
      .board()
      .then((next) => {
        if (next.role !== 'teacher') {
          setError('Ця сторінка лише для вчителя');
          return;
        }
        setData(next);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, []);

  if (!data && !error) {
    return (
      <CabinetPage kicker="Заняття" title="Учні" lead="Оберіть учня, щоб відкрити уроки.">
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  const groups = data?.groups ?? [];

  return (
    <CabinetPage kicker="Заняття" title="Учні" lead="Оберіть учня, щоб відкрити уроки.">
      {error ? <p className="error">{error}</p> : null}
      {!groups.length && !error ? (
        <article className="cabinet-banner is-empty">
          <div>
            <p className="cabinet-banner-label">Поки порожньо</p>
            <p className="cabinet-banner-title">Вам ще не призначено учнів</p>
          </div>
        </article>
      ) : null}
      {groups.length ? (
        <div className="lesson-mosaic is-people">
          {groups.map((group) => {
            const parts = splitLessonPack(group);
            const next = nextConfirmed(parts.confirmed);
            const clock = next ? lessonClock(next) : '';
            const day = next ? lessonDayShort(next) : '';
            const state = next && lessonWhen(next)
              ? `Наступний · ${day}`
              : parts.waiting.length
                ? `${parts.waiting.length} на узгодженні`
                : group.current
                  ? 'Немає підтвердженого слота'
                  : 'Немає тарифу';
            return (
              <Link
                key={group.student.id}
                href={teacherStudentPath(group.student.id)}
                className={`lesson-tile ${next ? 'is-ok' : 'is-off'}`}
              >
                {group.student.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={group.student.avatarUrl} alt="" className="lesson-tile-av" />
                ) : (
                  <span className="lesson-tile-no">{personInitials(group.student.name, group.student.email)}</span>
                )}
                <span className="lesson-tile-when">
                  <b>{group.student.name || 'Без імені'}</b>
                  <span>{clock ? `${clock}${day ? ` · ${day}` : ''}` : group.student.email}</span>
                </span>
                <span className="lesson-tile-state">{state}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </CabinetPage>
  );
}
