'use client';

import type { HourState, ScheduleOverview } from './api';
import { WEEKDAYS, formatDayLabel, formatMinute, formatWeekRange, todayYmd } from './hours';
import { useScheduleLessonMenu } from './useScheduleLessonMenu';

const STATE_LABEL: Record<HourState, string> = {
  free: 'Вільно',
  off: 'Не працює',
  busy: 'Зайнято',
  lesson: 'Урок',
  proposed: 'Очікує',
};

export function ScheduleCalendar({
  data,
  onPrev,
  onNext,
  onToday,
  onRefresh,
}: {
  data: ScheduleOverview;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onRefresh?: () => Promise<void> | void;
}) {
  const today = todayYmd();
  const hours = data.days[0]?.hours.map((slot) => slot.hour) ?? [];
  const { lessonHitProps, ui } = useScheduleLessonMenu(onRefresh);

  return (
    <section className="cal">
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="btn ghost" type="button" onClick={onPrev} aria-label="Попередній тиждень">
            ←
          </button>
          <button className="btn ghost" type="button" onClick={onToday}>
            Сьогодні
          </button>
          <button className="btn ghost" type="button" onClick={onNext} aria-label="Наступний тиждень">
            →
          </button>
        </div>
        <h2>{formatWeekRange(data.from)}</h2>
        <div className="cal-legend">
          <span className="cal-chip is-free">Вільно</span>
          <span className="cal-chip is-off">Не працює</span>
          <span className="cal-chip is-busy">Зайнято</span>
          <span className="cal-chip is-ok">Урок</span>
          <span className="cal-chip is-daily">Очікує</span>
        </div>
      </div>
      {ui}
      <div className="cal-scroll">
        <div className="cal-grid">
          <div className="cal-time" />
          {data.days.map((day) => (
            <div key={day.date} className={`cal-day${day.date === today ? ' is-today' : ''}`}>
              <span>{WEEKDAYS.find((item) => item.value === day.weekday)?.short}</span>
              <b>{formatDayLabel(day.date)}</b>
            </div>
          ))}
          {hours.flatMap((hour) => [
            <div key={`t-${hour}`} className="cal-time">
              {formatMinute(hour * 60)}
            </div>,
            ...data.days.map((day) => {
              const slot = day.hours.find((item) => item.hour === hour);
              const state = slot?.state ?? 'free';
              const lesson = slot?.lesson;
              const title = lesson
                ? `${formatMinute(hour * 60)} · Урок ${lesson.number}${lesson.with ? ` · ${lesson.with}` : ''} · ${STATE_LABEL[state]}`
                : `${formatMinute(hour * 60)} · ${STATE_LABEL[state]}`;
              return (
                <div
                  key={`${day.date}-${hour}`}
                  className={`cal-cell is-${state}${day.date === today ? ' is-today' : ''}${lesson ? ' is-hit' : ''}`}
                  title={title}
                  {...(lesson ? lessonHitProps(lesson) : {})}
                >
                  {lesson ? <span>У{lesson.number}</span> : null}
                </div>
              );
            }),
          ])}
        </div>
      </div>
    </section>
  );
}
