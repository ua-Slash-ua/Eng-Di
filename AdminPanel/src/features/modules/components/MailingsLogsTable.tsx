'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Ban, CircleAlert, Mail } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { Modal } from '@/components/Modal';
import { formatDateTime } from '@/components/MetaBar';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { mailingsApi, type MailingLog, MAILING_TYPE_OPTIONS } from '../api';

const TYPE_OPTIONS = MAILING_TYPE_OPTIONS;

const STATUS_OPTIONS = [
  { value: 'sent', label: 'Надіслано' },
  { value: 'skipped', label: 'Пропущено' },
  { value: 'failed', label: 'Помилка' },
];

const STATUS_LABELS: Record<string, string> = {
  sent: 'Надіслано',
  skipped: 'Пропущено',
  failed: 'Помилка',
};

function hasErrorDetails(item: MailingLog) {
  return item.status !== 'sent' || Boolean(item.errorRaw || item.errorParsed || item.error);
}

function MailingErrorDetails({ item }: { item: MailingLog }) {
  const [open, setOpen] = useState(false);
  if (!hasErrorDetails(item)) {
    return <span className="muted">—</span>;
  }

  const tone = item.status === 'skipped' ? 'skipped' : 'failed';
  const shape = readErrorShape(item.errorRaw);
  const lines = explanationLines(item.errorParsed || item.error);
  const dump = formatDump(item.errorRaw || item.error || 'Немає сирої відповіді');
  const title = detailTitle(item, shape, lines);

  return (
    <>
      <button
        type="button"
        className="icon-btn mailing-error-btn"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label="Деталі помилки"
        title="Деталі помилки"
      >
        <CircleAlert size={16} />
      </button>
      <Modal title="Деталі відправки" open={open} onClose={() => setOpen(false)} size="lg">
        <div className="mailing-error-modal">
          <div className={`mailing-error-banner is-${tone}`}>
            <div className="mailing-error-banner-icon">
              {tone === 'skipped' ? <Ban size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <b>{title}</b>
              {lines
                .filter((line) => line !== title)
                .map((line) => (
                  <p key={line}>{line}</p>
                ))}
            </div>
          </div>

          <div className="mailing-error-chips">
            <span
              className={`status-pill${
                item.status === 'sent' ? ' status-active' : item.status === 'failed' ? ' status-review' : ''
              }`}
            >
              {STATUS_LABELS[item.status] || item.status}
            </span>
            <span className="mailing-error-chip">
              <Mail size={12} />
              {item.email}
            </span>
            <span className="mailing-error-chip">{item.typeLabel || item.reason}</span>
            <span className="mailing-error-chip">{formatDateTime(item.createdAt)}</span>
            {shape?.responseCode ? <span className="mailing-error-chip is-code">SMTP {shape.responseCode}</span> : null}
            {shape?.dsnStatus ? <span className="mailing-error-chip is-code">DSN {shape.dsnStatus}</span> : null}
          </div>

          {shape ? (
            <dl className="mailing-error-facts">
              {shape.code ? (
                <>
                  <dt>Код</dt>
                  <dd>{shape.code}</dd>
                </>
              ) : null}
              {shape.action ? (
                <>
                  <dt>Дія</dt>
                  <dd>{shape.action}</dd>
                </>
              ) : null}
              {shape.emails?.length ? (
                <>
                  <dt>Адреси</dt>
                  <dd>{shape.emails.join(', ')}</dd>
                </>
              ) : null}
              {shape.response || shape.message ? (
                <>
                  <dt>Сервер</dt>
                  <dd>{shape.response || shape.message}</dd>
                </>
              ) : null}
            </dl>
          ) : null}

          <div className="mailing-error-dump-card">
            <span>Сира відповідь</span>
            <pre>{dump}</pre>
          </div>
        </div>
      </Modal>
    </>
  );
}

type ErrorShape = {
  name?: string;
  code?: string;
  command?: string;
  responseCode?: number;
  dsnStatus?: string;
  response?: string;
  message?: string;
  action?: string;
  emails?: string[];
};

function readErrorShape(raw: string | null): ErrorShape | null {
  if (!raw?.trim().startsWith('{')) return null;
  try {
    const data = JSON.parse(raw) as ErrorShape;
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

function formatDump(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function explanationLines(text: string | null) {
  if (!text?.trim()) return [];
  return [
    ...new Set(
      text
        .split(/\.\s+/)
        .map((part) => part.replace(/\.+$/, '').trim())
        .filter(Boolean),
    ),
  ];
}

function detailTitle(item: MailingLog, shape: ErrorShape | null, lines: string[]) {
  if (item.status === 'skipped') return 'Лист не надсилався';
  if (shape?.dsnStatus === '5.1.1' || shape?.responseCode === 550) return 'Адресу не знайдено';
  if (shape?.code === 'SMTP_BOUNCE') return 'Лист повернуто';
  return lines[0] || 'Помилка відправки';
}

const columns: Column<MailingLog>[] = [
  {
    key: 'createdAt',
    header: 'Коли',
    width: '15%',
    nowrap: true,
    render: (item) => formatDateTime(item.createdAt),
  },
  {
    key: 'email',
    header: 'Пошта',
    width: '20%',
    nowrap: true,
    filter: { type: 'text', param: 'email', placeholder: 'Email…' },
    render: (item) => item.email,
  },
  {
    key: 'type',
    header: 'Причина',
    width: '20%',
    filter: { type: 'multi', param: 'type', options: TYPE_OPTIONS },
    render: (item) => item.typeLabel || item.reason,
  },
  {
    key: 'user',
    header: 'Користувач',
    width: '20%',
    filter: { type: 'text', param: 'user', placeholder: 'Імʼя або email…' },
    render: (item) =>
      item.user ? (
        <Link href={`/users/${item.user.id}`} className="mailing-user-link" onClick={(event) => event.stopPropagation()}>
          <b>{item.user.name || item.user.email}</b>
          {item.user.name && item.user.email !== item.user.name ? <span>{item.user.email}</span> : null}
        </Link>
      ) : (
        <span className="muted">Немає в базі</span>
      ),
  },
  {
    key: 'status',
    header: 'Статус',
    width: '14%',
    nowrap: true,
    filter: { type: 'multi', param: 'status', options: STATUS_OPTIONS },
    render: (item) => (
      <span
        className={`status-pill${
          item.status === 'sent' ? ' status-active' : item.status === 'failed' ? ' status-review' : ''
        }`}
      >
        {STATUS_LABELS[item.status] || item.status}
      </span>
    ),
  },
  {
    key: 'details',
    header: 'Деталі',
    width: '11%',
    nowrap: true,
    render: (item) => <MailingErrorDetails item={item} />,
  },
];

const FILTER_PARAMS = ['email', 'type', 'user', 'status'];

export function MailingsLogsTable() {
  const list = usePaginatedList<MailingLog>(
    '/modules/mailings',
    (query) =>
      mailingsApi.logs({
        page: query.page,
        limit: query.limit,
        ...query.filters,
      }),
    FILTER_PARAMS,
  );

  return (
    <>
      <FormAlerts error={list.error} />
      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        loading={list.loading}
        emptyText="Ще немає відправлених розсилок"
        columnFilters={{ values: list.filters, onChange: list.setFilter }}
        onReset={list.reset}
        hasActiveFilters={list.hasActiveFilters}
        pagination={{
          page: list.data.page,
          pageCount: list.data.pageCount,
          total: list.data.total,
          limit: list.limit,
          onPageChange: list.setPage,
          onLimitChange: list.setLimit,
        }}
      />
    </>
  );
}
