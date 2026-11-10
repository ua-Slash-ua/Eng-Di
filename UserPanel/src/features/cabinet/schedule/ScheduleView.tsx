'use client';

import { useEffect, useState } from 'react';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { cabinetScheduleApi, type ScheduleOverview } from './api';
import { shiftDate, todayYmd } from './hours';
import { ScheduleCalendar } from './ScheduleCalendar';
import { ScheduleSettings } from './ScheduleSettings';

export function ScheduleView() {
  const [tab, setTab] = useState<'week' | 'hours'>('week');
  const [from, setFrom] = useState(todayYmd);
  const [data, setData] = useState<ScheduleOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    cabinetScheduleApi
      .week(from)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Помилка');
      });
    return () => {
      cancelled = true;
    };
  }, [from]);

  if (!data && !error) {
    return (
      <CabinetPage wide title="Розклад" lead="Тиждень: вільні години, зайнятість і узгоджені уроки.">
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  return (
      <CabinetPage wide title="Розклад" lead="Тиждень: вільні години, зайнятість і узгоджені уроки.">
      <div className="cabinet-tabs">
        <button className={tab === 'week' ? 'active' : undefined} type="button" onClick={() => setTab('week')}>
          Тиждень
        </button>
        <button className={tab === 'hours' ? 'active' : undefined} type="button" onClick={() => setTab('hours')}>
          Графік
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {data && tab === 'week' ? (
        <ScheduleCalendar
          data={data}
          onPrev={() => setFrom(shiftDate(data.from, -7))}
          onNext={() => setFrom(shiftDate(data.from, 7))}
          onToday={() => setFrom(todayYmd())}
          onRefresh={() =>
            cabinetScheduleApi.week(data.from).then((next) => {
              setData(next);
            })
          }
        />
      ) : null}
      {data && tab === 'hours' ? <ScheduleSettings data={data} from={data.from} onChange={setData} /> : null}
    </CabinetPage>
  );
}
