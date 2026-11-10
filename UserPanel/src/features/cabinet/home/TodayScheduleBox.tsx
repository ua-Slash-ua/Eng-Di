'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cabinetBasePath } from '@/lib/roles';
import { cabinetScheduleApi, type HourState, type ScheduleLessonMark, type ScheduleOverview } from '../schedule/api';
import { formatLongDate, formatMinute, todayYmd } from '../schedule/hours';
import { useScheduleLessonMenu } from '../schedule/useScheduleLessonMenu';

const STATE_LABEL: Record<HourState, string> = {
  free: 'Вільно',
  off: 'Не працює',
  busy: 'Зайнято',
  lesson: 'Урок',
  proposed: 'Очікує',
};

type DayHour = ScheduleOverview['days'][number]['hours'][number];

function trimDayHours(hours: DayHour[]) {
  const first = hours.findIndex((slot) => slot.state !== 'off' || slot.lesson);
  if (first < 0) return [];
  let last = hours.length - 1;
  while (last > first && hours[last].state === 'off' && !hours[last].lesson) {
    last -= 1;
  }
  return hours.slice(first, last + 1);
}

function cellLabel(slot: DayHour) {
  if (slot.lesson) {
    const name = slot.lesson.with ? ` · ${slot.lesson.with}` : '';
    return `Урок ${slot.lesson.number}${name}`;
  }
  if (slot.state === 'busy') return 'Зайнято';
  return '';
}

function eventTitle(lesson: ScheduleLessonMark) {
  return `Урок ${lesson.number}`;
}

function eventChip(status: string) {
  if (status === 'confirmed' || status === 'done') return 'is-ok';
  if (status === 'missed') return 'is-busy';
  if (status === 'proposed' || status === 'rescheduling') return 'is-daily';
  return 'is-off';
}

function eventState(status: string) {
  if (status === 'proposed') return 'Очікує';
  if (status === 'rescheduling') return 'Перенесення';
  if (status === 'done') return 'Виконано';
  if (status === 'missed') return 'Пропущено';
  if (status === 'admin_skip') return 'Пропуск';
  return 'Підтверджено';
}

export function TodayScheduleBox({ role }: { role: 'student' | 'teacher' | null }) {
  const today = todayYmd();
  const nowHour = new Date().getHours();
  const [data, setData] = useState<ScheduleOverview | null>(null);
  const [error, setError] = useState('');
  const dayRef = useRef<HTMLDivElement>(null);
  const scheduleHref = `${cabinetBasePath(role)}/schedule`;
  const { lessonHitProps, ui } = useScheduleLessonMenu(() =>
    cabinetScheduleApi.week(today).then(setData),
  );

  useEffect(() => {
    let cancelled = false;
    cabinetScheduleApi
      .week(today)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Помилка');
      });
    return () => {
      cancelled = true;
    };
  }, [today]);

  const day = data?.days.find((item) => item.date === today);
  const hours = useMemo(() => (day ? trimDayHours(day.hours) : []), [day]);
  const events = useMemo(
    () =>
      (day?.hours ?? [])
        .filter((slot) => slot.lesson)
        .map((slot) => ({ hour: slot.hour, lesson: slot.lesson! })),
    [day],
  );

  useEffect(() => {
    const root = dayRef.current;
    if (!root) return;
    const target =
      root.querySelector<HTMLElement>('.cal-cell.is-now') ??
      root.querySelector<HTMLElement>('.cal-cell.is-lesson, .cal-cell.is-proposed');
    if (!target) return;
    const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
    root.scrollTo({ top: Math.max(0, top - root.clientHeight / 3) });
  }, [hours]);

  return (
    <article className="dash-box">
      <header className="dash-box-head">
        <div>
          <h2>Сьогодні</h2>
          <p className="muted">{formatLongDate(today)}</p>
        </div>
        <Link href={scheduleHref} className="btn ghost">
          Переглянути тиждень
        </Link>
      </header>
      {error ? <p className="error dash-box-note">{error}</p> : null}
      {ui}
      {!data && !error ? <p className="muted dash-box-note">Завантаження…</p> : null}
      {data ? (
        <div className="dash-today">
          <div className="dash-day">
            {hours.length ? (
              <div className="dash-day-grid" ref={dayRef}>
                {hours.flatMap((slot) => {
                  const isNow = day?.date === today && slot.hour === nowHour;
                  const label = cellLabel(slot);
                  return [
                    <div key={`t-${slot.hour}`} className="cal-time">
                      {formatMinute(slot.hour * 60)}
                    </div>,
                    <div
                      key={`c-${slot.hour}`}
                      className={`cal-cell is-${slot.state}${isNow ? ' is-now' : ''}${slot.lesson ? ' is-hit' : ''}`}
                      title={`${formatMinute(slot.hour * 60)} · ${label || STATE_LABEL[slot.state]}`}
                      {...(slot.lesson ? lessonHitProps(slot.lesson) : {})}
                    >
                      {label}
                    </div>,
                  ];
                })}
              </div>
            ) : (
              <div className="dash-day-empty">
                <p className="muted">Сьогодні не робочий день — занять у календарі немає.</p>
              </div>
            )}
          </div>
          <div className="dash-events">
            <h3>Що чекає сьогодні</h3>
            {events.length ? (
              <ul className="lesson-list">
                {events.map((item) => (
                  <li
                    key={item.lesson.id}
                    className="is-hit"
                    {...lessonHitProps(item.lesson)}
                  >
                    <span className="dash-event-time">{formatMinute(item.hour * 60)}</span>
                    <div className="cal-busy-copy">
                      <b>{eventTitle(item.lesson)}</b>
                      <span>{item.lesson.with || '1 година'}</span>
                    </div>
                    <span className={`cal-chip ${eventChip(item.lesson.status)}`}>{eventState(item.lesson.status)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dash-events-empty">
                <p className="muted">Сьогодні немає запланованих занять.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}
