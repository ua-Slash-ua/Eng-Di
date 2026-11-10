'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ScheduleOverview, WorkDayInput } from './api';
import { cabinetScheduleApi } from './api';
import {
  DEFAULT_WORK_END,
  DEFAULT_WORK_START,
  WEEKDAYS,
  formatMinute,
  timeOptions,
  weekdayLabel,
} from './hours';
import { MenuSelect, TimeSelect } from './TimeSelect';

const TIMES = timeOptions(6, 22, 30);

function busyTitle(row: ScheduleOverview['busy'][number]) {
  if (row.scope === 'date' && row.date) return row.date.split('-').reverse().join('.');
  if (row.scope === 'daily') return 'Кожен день';
  return weekdayLabel(row.weekday ?? 0);
}

function busyChip(scope: ScheduleOverview['busy'][number]['scope']) {
  if (scope === 'date') return { className: 'is-busy', label: 'Дата' };
  if (scope === 'daily') return { className: 'is-daily', label: 'Щодня' };
  return { className: 'is-off', label: 'Щотижня' };
}

function fromRules(work: ScheduleOverview['work']): WorkDayInput[] {
  return WEEKDAYS.map((day) => {
    const row = work.find((item) => item.weekday === day.value);
    if (row && row.endMinute > row.startMinute) {
      return { weekday: day.value, off: false, startMinute: row.startMinute, endMinute: row.endMinute };
    }
    return {
      weekday: day.value,
      off: Boolean(row),
      startMinute: DEFAULT_WORK_START,
      endMinute: DEFAULT_WORK_END,
    };
  });
}

export function ScheduleSettings({
  data,
  from,
  onChange,
}: {
  data: ScheduleOverview;
  from: string;
  onChange: (next: ScheduleOverview) => void;
}) {
  const [days, setDays] = useState<WorkDayInput[]>(() => fromRules(data.work));
  const [busyScope, setBusyScope] = useState<'weekly' | 'date' | 'daily'>('weekly');
  const [busyWeekday, setBusyWeekday] = useState(1);
  const [busyDate, setBusyDate] = useState(from);
  const [busyStart, setBusyStart] = useState(13 * 60);
  const [busyEnd, setBusyEnd] = useState(15 * 60);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busySaving, setBusySaving] = useState(false);

  useEffect(() => {
    setDays(fromRules(data.work));
  }, [data.work]);

  const workDirty = useMemo(() => JSON.stringify(days) !== JSON.stringify(fromRules(data.work)), [days, data.work]);

  function patchDay(weekday: number, patch: Partial<WorkDayInput>) {
    setDays((current) => current.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)));
  }

  async function saveWork(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusySaving(true);
    try {
      onChange(await cabinetScheduleApi.saveWork(days, from));
      setOk('Робочі години збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти графік');
    } finally {
      setBusySaving(false);
    }
  }

  async function addBusy(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusySaving(true);
    try {
      onChange(
        await cabinetScheduleApi.addBusy(
          {
            scope: busyScope,
            weekday: busyScope === 'weekly' ? busyWeekday : undefined,
            date: busyScope === 'date' ? busyDate : undefined,
            startMinute: busyStart,
            endMinute: busyEnd,
          },
          from,
        ),
      );
      setOk('Зайнятий слот додано');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося додати слот');
    } finally {
      setBusySaving(false);
    }
  }

  async function remove(id: number) {
    setError('');
    setOk('');
    setBusySaving(true);
    try {
      onChange(await cabinetScheduleApi.remove(id, from));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    } finally {
      setBusySaving(false);
    }
  }

  return (
    <div className="cal-settings">
      {error ? <p className="error">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}

      <div className="cal-settings-grid">
      <section className="card cal-panel">
        <header className="cal-panel-head">
          <div>
            <p className="cabinet-banner-label">Тиждень</p>
            <h2>Робочі години</h2>
          </div>
          <button
            className="cal-mini-btn"
            type="button"
            onClick={() => {
              const monday = days.find((day) => day.weekday === 1);
              if (!monday) return;
              setDays((current) =>
                current.map((day) => (day.weekday <= 5 ? { ...monday, weekday: day.weekday } : day)),
              );
            }}
          >
            Пн → Пт
          </button>
        </header>
        <p className="muted">Поза вікном день неробочий. Вимкнений день — повний вихідний.</p>
        <form onSubmit={saveWork}>
          <ul className="cal-work-list">
            {days.map((day) => {
              const meta = WEEKDAYS.find((item) => item.value === day.weekday);
              return (
                <li key={day.weekday} className={`${day.off ? 'is-off' : ''}${day.weekday >= 6 ? ' is-weekend' : ''}`}>
                  <span className="cal-work-badge">{meta?.short}</span>
                  <div className="cal-work-meta">
                    <b>{meta?.label}</b>
                    <span>{day.off ? 'Вихідний' : 'Робочий'}</span>
                  </div>
                  {day.off ? (
                    <div className="cal-times is-off">Вимкнено</div>
                  ) : (
                    <div className="cal-times">
                      <TimeSelect
                        value={day.startMinute}
                        options={TIMES}
                        ariaLabel={`${meta?.label}, початок`}
                        onChange={(value) => patchDay(day.weekday, { startMinute: value })}
                      />
                      <span>—</span>
                      <TimeSelect
                        value={day.endMinute}
                        options={TIMES}
                        ariaLabel={`${meta?.label}, кінець`}
                        onChange={(value) => patchDay(day.weekday, { endMinute: value })}
                      />
                    </div>
                  )}
                  <button
                    className={`cal-switch${day.off ? '' : ' is-on'}`}
                    type="button"
                    aria-pressed={!day.off}
                    onClick={() => patchDay(day.weekday, { off: !day.off })}
                  >
                    <span />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="cal-settings-actions">
            <button className="btn" type="submit" disabled={busySaving || !workDirty}>
              {busySaving ? 'Збереження…' : 'Зберегти графік'}
            </button>
          </div>
        </form>
      </section>

      <section className="card cal-panel">
        <header className="cal-panel-head">
          <div>
            <p className="cabinet-banner-label">Винятки</p>
            <h2>Зайняті години</h2>
          </div>
        </header>
        <p className="muted">Слоти поверх робочого вікна: щодня, щотижня або на конкретну дату.</p>
        <form className="cal-busy-form" onSubmit={addBusy}>
          <label className={`cal-field${busyScope === 'daily' ? ' is-span' : ''}`}>
            Повтор
            <MenuSelect
              value={busyScope}
              ariaLabel="Повтор зайнятого слоту"
              onChange={setBusyScope}
              options={[
                { value: 'daily', label: 'Щодня' },
                { value: 'weekly', label: 'Щотижня' },
                { value: 'date', label: 'Конкретна дата' },
              ]}
            />
          </label>
          {busyScope === 'daily' ? null : (
            <label className="cal-field">
              {busyScope === 'weekly' ? 'День' : 'Дата'}
              {busyScope === 'weekly' ? (
                <MenuSelect
                  value={busyWeekday}
                  ariaLabel="День зайнятого слоту"
                  onChange={setBusyWeekday}
                  options={WEEKDAYS.map((day) => ({ value: day.value, label: day.label }))}
                />
              ) : (
                <input type="date" value={busyDate} onChange={(event) => setBusyDate(event.target.value)} required />
              )}
            </label>
          )}
          <label className="cal-field">
            З
            <TimeSelect
              value={busyStart}
              options={TIMES}
              ariaLabel="Початок зайнятого слоту"
              onChange={setBusyStart}
            />
          </label>
          <label className="cal-field">
            До
            <TimeSelect
              value={busyEnd}
              options={TIMES}
              ariaLabel="Кінець зайнятого слоту"
              onChange={setBusyEnd}
            />
          </label>
          <button className="btn" type="submit" disabled={busySaving}>
            Додати
          </button>
        </form>
        {data.busy.length ? (
          <ul className="cal-busy-list">
            {data.busy.map((row) => {
              const chip = busyChip(row.scope);
              return (
                <li key={row.id}>
                  <span className={`cal-chip ${chip.className}`}>{chip.label}</span>
                  <div className="cal-busy-copy">
                    <b>{busyTitle(row)}</b>
                    <span>
                      {formatMinute(row.startMinute)} – {formatMinute(row.endMinute)}
                    </span>
                  </div>
                  <button className="cal-busy-remove" type="button" disabled={busySaving} onClick={() => void remove(row.id)}>
                    Прибрати
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="cal-empty">Поки немає зайнятих слотів.</div>
        )}
      </section>
      </div>
    </div>
  );
}
