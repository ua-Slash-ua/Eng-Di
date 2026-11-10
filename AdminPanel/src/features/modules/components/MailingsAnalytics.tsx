'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, Ban, CheckCircle2, Mail, Percent, Power, Send } from 'lucide-react';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { formatDateTime } from '@/components/MetaBar';
import { mailingsApi, type MailingStats } from '../api';

export function MailingsAnalytics() {
  const [data, setData] = useState<MailingStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    mailingsApi
      .stats()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Не вдалося завантажити аналітику'));
  }, []);

  const maxDay = Math.max(1, ...(data?.days.map((item) => item.total) ?? [1]));

  return (
    <>
      <FormAlerts error={error} />
      <div className="stats">
        <StatCard
          label="Усього листів"
          value={data?.totals.total}
          hint={`${data?.uniqueEmails ?? '—'} унікальних адрес`}
          icon={<Mail size={16} />}
          color="purple"
        />
        <StatCard
          label="Надіслано"
          value={data?.totals.sent}
          hint={`сьогодні ${data?.today.sent ?? '—'}`}
          icon={<Send size={16} />}
          color="mint"
        />
        <StatCard
          label="Помилки"
          value={data?.totals.failed}
          hint={`сьогодні ${data?.today.failed ?? '—'}`}
          icon={<AlertTriangle size={16} />}
          color="pink"
        />
        <StatCard
          label="Успішність"
          value={data?.successRate == null ? undefined : data.successRate}
          suffix={data?.successRate == null ? undefined : '%'}
          hint={`пропущено ${data?.totals.skipped ?? '—'}`}
          icon={<Percent size={16} />}
          color="yellow"
        />
      </div>

      <div className="stats">
        <StatCard
          label="Сьогодні"
          value={data?.today.total}
          hint={`${data?.today.sent ?? 0} надіслано · ${data?.today.failed ?? 0} помилок`}
          icon={<CheckCircle2 size={16} />}
          color="mint"
        />
        <StatCard
          label="За 7 днів"
          value={data?.week.total}
          hint={`${data?.week.sent ?? 0} надіслано · ${data?.week.failed ?? 0} помилок`}
          icon={<Send size={16} />}
          color="purple"
        />
        <StatCard
          label="Пропущено"
          value={data?.totals.skipped}
          hint="SMTP вимкнено або розсилку вимкнено"
          icon={<Ban size={16} />}
          color="yellow"
        />
        <StatCard
          label="Активні типи"
          value={data?.enabledTypes}
          hint={
            data == null
              ? 'увімкнені розсилки'
              : data.moduleEnabled
                ? `модуль увімкнено · з ${data.typesTotal}`
                : `модуль вимкнено · з ${data.typesTotal}`
          }
          icon={<Power size={16} />}
          color="pink"
        />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h3>Останні 14 днів</h3>
          </div>
          <div className="mailing-day-bars">
            {(data?.days ?? []).map((day) => {
              const height = Math.max(8, Math.round((day.total / maxDay) * 100));
              return (
                <div key={day.date} className="mailing-day-col" title={`${day.label}: ${day.total}`}>
                  <div className="mailing-day-stack" style={{ height: `${height}%` }}>
                    {day.sent ? <span className="mailing-day-seg is-sent" style={{ flex: day.sent }} /> : null}
                    {day.skipped ? <span className="mailing-day-seg is-skipped" style={{ flex: day.skipped }} /> : null}
                    {day.failed ? <span className="mailing-day-seg is-failed" style={{ flex: day.failed }} /> : null}
                    {!day.total ? <span className="mailing-day-seg is-empty" /> : null}
                  </div>
                  <span className="mailing-day-label">{day.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mailing-chart-legend">
            <span className="is-sent">Надіслано</span>
            <span className="is-skipped">Пропущено</span>
            <span className="is-failed">Помилка</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>За типами</h3>
          </div>
          <div className="form-box">
            {!data?.byType.length ? (
              <p className="muted">Ще немає відправок</p>
            ) : (
              data.byType.map((item) => (
                <div key={item.type} className="mailing-type-row">
                  <div className="mailing-type-head">
                    <b>{item.typeLabel}</b>
                    <span>{item.total}</span>
                  </div>
                  <div className="mailing-type-bar">
                    <i className="is-sent" style={{ width: `${pct(item.sent, item.total)}%` }} />
                    <i className="is-skipped" style={{ width: `${pct(item.skipped, item.total)}%` }} />
                    <i className="is-failed" style={{ width: `${pct(item.failed, item.total)}%` }} />
                  </div>
                  <em>
                    {item.sent} надіслано · {item.skipped} пропущено · {item.failed} помилок
                  </em>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1.3889vw' }}>
        <div className="panel-head">
          <h3>Останні помилки</h3>
        </div>
        <div className="form-box">
          {!data?.failed.length ? (
            <p className="muted">Помилок поки немає</p>
          ) : (
            data.failed.map((item) => (
              <div key={item.id} className="usage-row mailing-fail-row">
                <div className="stat-icon" style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <b>{item.typeLabel}</b>
                  <span>
                    {item.email} · {formatDateTime(item.createdAt)}
                  </span>
                  {item.error ? <em>{item.error}</em> : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function StatCard({
  label,
  value,
  hint,
  icon,
  color,
  suffix,
}: {
  label: string;
  value: number | undefined;
  hint: string;
  icon: ReactNode;
  color: 'mint' | 'purple' | 'pink' | 'yellow';
  suffix?: string;
}) {
  const tones = {
    mint: { background: 'var(--mint-soft)', color: 'var(--mint)' },
    purple: { background: 'var(--purple-soft)', color: 'var(--purple)' },
    pink: { background: 'var(--pink-soft)', color: 'var(--pink)' },
    yellow: { background: 'var(--yellow-soft)', color: 'var(--yellow)' },
  };
  return (
    <div className="stat-card">
      <div className="top-row">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={tones[color]}>
          {icon}
        </div>
      </div>
      <div className="stat-value">
        {value ?? '—'}
        {value != null && suffix ? suffix : ''}
      </div>
      <div className="stat-delta" style={{ color: 'var(--text-soft)' }}>
        {hint}
      </div>
    </div>
  );
}
