'use client';

import { useEffect, useState } from 'react';
import { WEEKDAYS, formatDayLabel, formatMinute, formatWeekRange, shiftDate, todayYmd } from '../schedule/hours';
import { cabinetLessonsApi, type LessonSlots } from './api';

type SlotTime = { hour: number; minute: number };

function mondayOf(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay() === 0 ? 7 : date.getDay();
  return shiftDate(value, 1 - weekday);
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function slotKey(slot: SlotTime) {
  return `${slot.hour}:${pad2(slot.minute)}`;
}

function parseTimeInput(value: string): SlotTime | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 6 || hour > 21 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function sameSlot(a: SlotTime | null | undefined, b: SlotTime) {
  return !!a && a.hour === b.hour && a.minute === b.minute;
}

export function LessonSlotModal({
  lessonId,
  title,
  onClose,
  onPicked,
}: {
  lessonId: number;
  title: string;
  onClose: () => void;
  onPicked: (date: string, hour: number, minute?: number) => Promise<void>;
}) {
  const [from, setFrom] = useState(() => mondayOf(todayYmd()));
  const [aligned, setAligned] = useState(false);
  const [data, setData] = useState<LessonSlots | null>(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<{ date: string; hour: number; minute: number } | null>(null);
  const [customByDay, setCustomByDay] = useState<Record<string, SlotTime[]>>({});
  const [customDay, setCustomDay] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState('12:00');
  const [customError, setCustomError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError('');
    cabinetLessonsApi
      .slots(lessonId, from)
      .then((next) => {
        if (cancelled) return;
        const minMonday = next.sequence?.afterDate ? mondayOf(next.sequence.afterDate) : null;
        if (!aligned && minMonday && minMonday > from) {
          setAligned(true);
          setFrom(minMonday);
          return;
        }
        setAligned(true);
        setData(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не вдалося завантажити слоти');
      });
    return () => {
      cancelled = true;
    };
  }, [lessonId, from, aligned]);

  function pickSlot(date: string, slot: SlotTime) {
    setCustomDay(null);
    setCustomError('');
    setPicked({ date, ...slot });
  }

  function openCustom(day: { date: string; hours: number[] }) {
    setCustomError('');
    setCustomDay(day.date);
    const seed = picked?.date === day.date ? picked.hour : day.hours[0];
    const minute = picked?.date === day.date ? picked.minute : 0;
    setCustomTime(`${pad2(seed ?? 12)}:${pad2(minute)}`);
  }

  function applyCustom(day: { date: string; hours: number[] }) {
    const parsed = parseTimeInput(customTime);
    if (!parsed) {
      setCustomError('Формат ГГ:ХХ, години 6–21');
      return;
    }
    if (!day.hours.includes(parsed.hour)) {
      setCustomError('Ця година не вільна у вас обох');
      return;
    }
    setCustomByDay((prev) => {
      const list = prev[day.date] ?? [];
      if (list.some((item) => sameSlot(item, parsed))) return prev;
      if (parsed.minute === 0) return prev;
      return {
        ...prev,
        [day.date]: [...list, parsed].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)),
      };
    });
    setCustomError('');
    setCustomDay(null);
    setPicked({ date: day.date, ...parsed });
  }

  const pickedLabel = picked
    ? `${formatDayLabel(picked.date)} · ${formatMinute(picked.hour * 60 + picked.minute)}`
    : '';

  return (
    <div className="cabinet-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="cabinet-modal is-wide"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="cabinet-modal-body">
          <h3>{title}</h3>
          <p className="muted">
            {data?.sequence?.hint || 'Лише години, вільні і у вас, і в іншої сторони. Уроки ставляться за номерами.'}
          </p>
          <div className="lesson-slot-nav">
            <button
              className="btn ghost"
              type="button"
              disabled={Boolean(data?.sequence?.afterDate && from <= mondayOf(data.sequence.afterDate))}
              onClick={() => setFrom(shiftDate(from, -7))}
            >
              ←
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                const today = mondayOf(todayYmd());
                const min = data?.sequence?.afterDate ? mondayOf(data.sequence.afterDate) : today;
                setFrom(today > min ? today : min);
              }}
            >
              Сьогодні
            </button>
            <button className="btn ghost" type="button" onClick={() => setFrom(shiftDate(from, 7))}>
              →
            </button>
            <b>{data ? formatWeekRange(data.from) : '…'}</b>
          </div>
          {error ? <p className="error">{error}</p> : null}
          {data?.sequence?.blockedReason ? <p className="error">{data.sequence.blockedReason}</p> : null}
          {data && !data.sequence?.blockedReason ? (
            <div className="lesson-slots">
              {data.days.map((day) => {
                const roundSlots: SlotTime[] = day.hours.map((hour) => ({ hour, minute: 0 }));
                const extras = (customByDay[day.date] ?? []).filter(
                  (slot) => !(slot.minute === 0 && day.hours.includes(slot.hour)),
                );
                const slots = [...roundSlots, ...extras].sort(
                  (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
                );
                return (
                  <div key={day.date} className="lesson-slot-day">
                    <b>
                      {WEEKDAYS.find((item) => item.value === day.weekday)?.short} {formatDayLabel(day.date)}
                    </b>
                    {day.hours.length ? (
                      <>
                        <div className="lesson-slot-hours">
                          {slots.map((slot) => {
                            const active = picked?.date === day.date && sameSlot(picked, slot);
                            return (
                              <button
                                key={slotKey(slot)}
                                className={`lesson-slot-hour${active ? ' is-on' : ''}`}
                                type="button"
                                onClick={() => pickSlot(day.date, slot)}
                              >
                                {formatMinute(slot.hour * 60 + slot.minute)}
                              </button>
                            );
                          })}
                          <button
                            className={`lesson-slot-hour is-custom${customDay === day.date ? ' is-on' : ''}`}
                            type="button"
                            onClick={() => openCustom(day)}
                          >
                            Точно
                          </button>
                        </div>
                        {customDay === day.date ? (
                          <div className="lesson-slot-exact">
                            <input
                              type="time"
                              min="06:00"
                              max="21:59"
                              step={60}
                              value={customTime}
                              onChange={(event) => setCustomTime(event.target.value)}
                              aria-label="Точний час"
                            />
                            <button className="cal-mini-btn" type="button" onClick={() => applyCustom(day)}>
                              Ок
                            </button>
                            {customError ? <span className="error">{customError}</span> : null}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span className="muted">Немає спільного часу в цій черговості</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : data?.sequence?.blockedReason ? null : (
            <p className="muted">Завантаження…</p>
          )}
          {pickedLabel ? <p className="muted lesson-slot-picked">Обрано: {pickedLabel}</p> : null}
        </div>
        <div className="cabinet-modal-actions">
          <button className="btn ghost" type="button" onClick={onClose}>
            Скасувати
          </button>
          <button
            className="btn"
            type="button"
            disabled={!picked || saving || Boolean(data?.sequence?.blockedReason)}
            onClick={() => {
              if (!picked) return;
              setSaving(true);
              void onPicked(picked.date, picked.hour, picked.minute).finally(() => setSaving(false));
            }}
          >
            {saving ? 'Надсилання…' : 'Запропонувати'}
          </button>
        </div>
      </div>
    </div>
  );
}
