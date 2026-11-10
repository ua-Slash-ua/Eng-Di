'use client';

import { useEffect, useState } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { discountPercent, formatUah } from '@/lib/tariffs';
import { ICONS } from '@/lib/svgIcon';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { freezeCountLabel } from '@/features/cabinet/lessons/labels';
import {
  cabinetTariffsApi,
  type CabinetTariff,
  type CabinetTariffsResponse,
  type CabinetUserTariff,
} from './api';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('uk-UA');
}

function durationLabel(months: number) {
  if (months === 1) return '1 місяць';
  if (months === 3) return '3 місяці';
  if (months === 6) return '6 місяців';
  if (months === 12) return '12 місяців';
  return `${months} міс.`;
}

function partsWord(count: number) {
  const n = Math.max(1, count || 1);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} частина`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} частини`;
  return `${n} частин`;
}

function statusLabel(status: CabinetUserTariff['status']) {
  if (status === 'active') return 'Зараз';
  if (status === 'scheduled') return 'Заплановано';
  if (status === 'expired') return 'Минулий';
  return 'Скасовано';
}

export function StudentTariffsView() {
  const [data, setData] = useState<CabinetTariffsResponse | null>(null);
  const [tab, setTab] = useState<'mine' | 'available'>('available');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ tariff: CabinetTariff; message: string } | null>(null);

  useEffect(() => {
    cabinetTariffsApi
      .overview()
      .then((next) => {
        setData(next);
        setTab(next.current ? 'mine' : 'available');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, []);

  async function apply(tariff: CabinetTariff, confirmed = false) {
    setError('');
    setOk('');
    setBusyId(tariff.id);
    try {
      const next = await cabinetTariffsApi.select(tariff.id, confirmed);
      setData(next);
      if (next.needsConfirm && next.message) {
        setConfirm({ tariff, message: next.message });
      } else {
        setConfirm(null);
        setTab('mine');
        if (next.message) setOk(next.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося змінити тариф');
    } finally {
      setBusyId(null);
    }
  }

  async function cancelScheduled() {
    setError('');
    setOk('');
    try {
      const next = await cabinetTariffsApi.cancelScheduled();
      setData(next);
      if (next.message) setOk(next.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося скасувати зміну');
    }
  }

  const lead = 'Оберіть пакет або перегляньте поточний. Термін рахується від дня підключення.';

  if (!data && !error) {
    return (
      <CabinetPage title="Тарифи" lead={lead}>
        <p className="muted">Завантаження тарифів…</p>
      </CabinetPage>
    );
  }

  return (
    <CabinetPage title="Тарифи" lead={lead}>
      {error ? <p className="error">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}

      <div className="cabinet-tabs" role="tablist">
        <button
          className={tab === 'mine' ? 'active' : undefined}
          type="button"
          role="tab"
          aria-selected={tab === 'mine'}
          onClick={() => setTab('mine')}
        >
          Моє
        </button>
        <button
          className={tab === 'available' ? 'active' : undefined}
          type="button"
          role="tab"
          aria-selected={tab === 'available'}
          onClick={() => setTab('available')}
        >
          Доступні
        </button>
      </div>

      {tab === 'mine' ? (
        <MineTab data={data} onBrowse={() => setTab('available')} onCancelScheduled={() => void cancelScheduled()} />
      ) : (
        <AvailableTab data={data} busyId={busyId} onApply={(tariff) => void apply(tariff)} />
      )}

      {confirm ? (
        <div className="cabinet-modal-backdrop" onClick={() => setConfirm(null)} role="presentation">
          <div className="cabinet-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="cabinet-modal-body">
              <h3>Зміна тарифу</h3>
              <p>{confirm.message}</p>
            </div>
            <div className="cabinet-modal-actions">
              <button className="btn ghost" type="button" onClick={() => setConfirm(null)}>
                Скасувати
              </button>
              <button className="btn" type="button" onClick={() => void apply(confirm.tariff, true)}>
                Підтвердити
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </CabinetPage>
  );
}

function MineTab({
  data,
  onBrowse,
  onCancelScheduled,
}: {
  data: CabinetTariffsResponse | null;
  onBrowse: () => void;
  onCancelScheduled: () => void;
}) {
  if (!data?.current) {
    return (
      <article className="cabinet-banner is-empty">
        <div>
          <p className="cabinet-banner-label">Немає активного тарифу</p>
          <p className="cabinet-banner-title">Оберіть пакет — він увімкнеться одразу</p>
        </div>
        <button className="btn" type="button" onClick={onBrowse}>
          Дивитись доступні
        </button>
      </article>
    );
  }

  return (
    <>
      <MyTariffCard row={data.current} tone="current" />
      {data.scheduled ? (
        <MyTariffCard row={data.scheduled} tone="next" onCancel={onCancelScheduled} />
      ) : null}
      {data.history.length ? (
        <section className="card cabinet-history">
          <h2 className="tariff-history-title">Історія</h2>
          <ul className="tariff-history">
            {data.history.map((row) => (
              <li key={row.id}>
                <span>
                  <b>{row.tariff.title}</b>
                  <span className={`my-status is-${row.status}`}>{statusLabel(row.status)}</span>
                </span>
                <span className="muted">
                  {formatDate(row.startsAt)} — {formatDate(row.endsAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function MyTariffCard({
  row,
  tone,
  onCancel,
}: {
  row: CabinetUserTariff;
  tone: 'current' | 'next';
  onCancel?: () => void;
}) {
  const tariff = row.tariff;
  const parts = Math.max(1, tariff.installmentCount || 1);
  const perPart = parts > 1 ? Math.round(tariff.price / parts) : null;

  return (
    <article className={`my-tariff is-${tone}`}>
      <div>
        <p className="cabinet-banner-label">{tone === 'current' ? 'Зараз активний' : 'Заплановано'}</p>
        <h2>{tariff.title}</h2>
        <p className="muted">
          {formatDate(row.startsAt)} — {formatDate(row.endsAt)}
        </p>
        <div className="tariff-pick-meta">
          <span>{tariff.lessons} уроків</span>
          <span>{durationLabel(tariff.durationMonths)}</span>
          <span>{parts <= 1 ? 'Одразу' : partsWord(parts)}</span>
          {(tariff.frozenLessonsPerMonth ?? 0) > 0 ? (
            <span>{freezeCountLabel(tariff.frozenLessonsPerMonth ?? 0)} / міс</span>
          ) : null}
          {tone === 'current' ? (
            <span>
              доступно {row.availableLessons} / {row.totalLessons}
            </span>
          ) : null}
        </div>
        {row.payments?.length ? (
          <div className="tariff-pick-meta">
            {row.payments.map((part) => (
              <span key={part.id} className={part.paid ? 'is-paid' : undefined}>
                {row.payments.length === 1 ? 'Тариф' : `${part.partNumber} частина`}
                {part.paid ? ' · оплачено' : ' · очікує'}
              </span>
            ))}
          </div>
        ) : null}
        <p className="my-tariff-price">
          {formatUah(tariff.price)} грн
          {tariff.lessonPrice ? ` · ${formatUah(tariff.lessonPrice)} грн / урок` : ''}
          {perPart ? ` · ${formatUah(perPart)} грн / частина` : ''}
        </p>
      </div>
      {onCancel ? (
        <button className="btn ghost" type="button" onClick={onCancel}>
          Скасувати зміну
        </button>
      ) : null}
    </article>
  );
}

function variantClass(variant: string) {
  if (variant === 'mid') return 'is-mid';
  if (variant === 'pro') return 'is-pro';
  return 'is-start';
}

function AvailableTab({
  data,
  busyId,
  onApply,
}: {
  data: CabinetTariffsResponse | null;
  busyId: number | null;
  onApply: (tariff: CabinetTariff) => void;
}) {
  if (!data) {
    return <p className="muted">Завантаження тарифів…</p>;
  }

  return (
    <div className="tariff-pick-grid">
      {data.tariffs.map((tariff) => {
        const current = data.current?.tariff.id === tariff.id;
        const scheduled = data.scheduled?.tariff.id === tariff.id;
        const parts = Math.max(1, tariff.installmentCount || 1);
        const discount = discountPercent(tariff.price, tariff.oldPrice);
        const perPart = parts > 1 ? Math.round(tariff.price / parts) : null;
        return (
          <article
            key={tariff.id}
            className={`cab-tariff-card ${variantClass(tariff.variant)}${current ? ' is-current' : ''}${scheduled ? ' is-scheduled' : ''}${tariff.popular ? ' is-popular' : ''}`}
          >
            <div className="cab-tariff-card-badges">
              {tariff.popular ? (
                <span className="cab-tariff-badge is-popular">
                  <SvgIcon svg={ICONS.crown} size={14} /> Популярний
                </span>
              ) : null}
              {current ? <span className="cab-tariff-badge is-current">Зараз</span> : null}
              {scheduled && !current ? <span className="cab-tariff-badge is-scheduled">Далі</span> : null}
              {discount ? <span className="cab-tariff-badge is-discount">-{discount}%</span> : null}
            </div>

            <div className="cab-tariff-card-head">
              <span className="cab-tariff-icon" aria-hidden="true">
                <SvgIcon svg={tariff.icon || ICONS.book} size={28} />
              </span>
              <h3>{tariff.title}</h3>
            </div>

            <div className="cab-tariff-price-block">
              {tariff.oldPrice ? <div className="cab-tariff-old">{formatUah(tariff.oldPrice)} грн</div> : null}
              <div className="cab-tariff-price">
                {formatUah(tariff.price)} <span>грн</span>
              </div>
              <p className="cab-tariff-per-lesson">
                {tariff.lessons} уроків · {formatUah(tariff.lessonPrice)} грн / урок
              </p>
            </div>

            <div className="cab-tariff-pills">
              <span>{durationLabel(tariff.durationMonths)}</span>
              <span>{parts <= 1 ? 'Одразу' : partsWord(parts)}</span>
              {(tariff.frozenLessonsPerMonth ?? 0) > 0 ? (
                <span>{freezeCountLabel(tariff.frozenLessonsPerMonth ?? 0)} / міс</span>
              ) : null}
            </div>

            {perPart ? <p className="cab-tariff-part">{formatUah(perPart)} грн / частина</p> : null}

            {tariff.note ? <div className="cab-tariff-note">{tariff.note}</div> : null}

            <button
              className={`btn${current || scheduled ? ' is-muted' : ''}`}
              type="button"
              disabled={busyId === tariff.id || current || scheduled}
              onClick={() => onApply(tariff)}
            >
              {busyId === tariff.id
                ? 'Зачекайте…'
                : current
                  ? 'Поточний тариф'
                  : scheduled
                    ? 'Уже заплановано'
                    : data.current
                      ? 'Змінити після поточного'
                      : 'Активувати'}
            </button>
          </article>
        );
      })}
    </div>
  );
}
