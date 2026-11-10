'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Ban, CircleAlert } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { Modal } from '@/components/Modal';
import { formatDateTime } from '@/components/MetaBar';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import type { Paginated } from '@/lib/pagination';
import { mailingsApi, type MailingCronRun, type MailingTask } from '../api';

type CronInnerTab = 'runs' | 'tasks';

const KIND_OPTIONS = [{ value: 'lesson_reminder', label: 'Нагадування про урок за годину' }];

const TASK_STATUS_OPTIONS = [
  { value: 'pending', label: 'Очікує' },
  { value: 'claimed', label: 'В обробці' },
  { value: 'sent', label: 'Надіслано' },
  { value: 'skipped', label: 'Пропущено' },
  { value: 'cancelled', label: 'Скасовано' },
  { value: 'failed', label: 'Помилка' },
];

const RUN_STATUS_OPTIONS = [
  { value: 'ok', label: 'Ок' },
  { value: 'error', label: 'Помилка' },
  { value: 'running', label: 'В роботі' },
];

function emptyRuns(limit: number): Paginated<MailingCronRun> {
  return { items: [], total: 0, page: 1, limit, pageCount: 1 };
}

function taskStatusClass(item: MailingTask) {
  if (item.overdue) return ' status-review';
  if (item.status === 'sent') return ' status-active';
  if (item.status === 'failed') return ' status-review';
  return '';
}

function runStatusClass(item: MailingCronRun) {
  if (item.status === 'ok') return ' status-active';
  if (item.status === 'error') return ' status-review';
  return '';
}

function CronTaskDetails({ item }: { item: MailingTask }) {
  const [open, setOpen] = useState(false);
  if (!item.error && !item.errorRaw && item.status !== 'failed' && item.status !== 'skipped' && item.status !== 'cancelled') {
    return <span className="muted">—</span>;
  }

  return (
    <>
      <button
        type="button"
        className="icon-btn mailing-error-btn"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label="Деталі завдання"
        title="Деталі завдання"
      >
        <CircleAlert size={16} />
      </button>
      <Modal title="Деталі cron-дії" open={open} onClose={() => setOpen(false)} size="lg">
        <div className="mailing-error-modal">
          <div className={`mailing-error-banner ${item.status === 'cancelled' || item.status === 'skipped' ? 'is-skipped' : 'is-failed'}`}>
            <div className="mailing-error-banner-icon">
              {item.status === 'cancelled' || item.status === 'skipped' ? <Ban size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <b>{item.statusLabel}</b>
              <p>{item.reason}</p>
              {item.error ? <p>{item.error}</p> : null}
            </div>
          </div>
          {item.errorRaw ? (
            <div className="mailing-error-dump-card">
              <span>Сира відповідь</span>
              <pre>{item.errorRaw}</pre>
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

function CronRunDetails({ item }: { item: MailingCronRun }) {
  const [open, setOpen] = useState(false);
  if (!item.error && item.status !== 'error') {
    return <span className="muted">—</span>;
  }

  return (
    <>
      <button
        type="button"
        className="icon-btn mailing-error-btn"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label="Деталі запуску"
        title="Деталі запуску"
      >
        <CircleAlert size={16} />
      </button>
      <Modal title="Деталі запуску воркера" open={open} onClose={() => setOpen(false)} size="lg">
        <div className="mailing-error-modal">
          <div className={`mailing-error-banner ${item.status === 'error' ? 'is-failed' : 'is-skipped'}`}>
            <div className="mailing-error-banner-icon">
              {item.status === 'error' ? <AlertTriangle size={18} /> : <Ban size={18} />}
            </div>
            <div>
              <b>{item.statusLabel}</b>
              <p>{item.actionLabel}</p>
              {item.error ? <p>{item.error}</p> : null}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

const taskColumns: Column<MailingTask>[] = [
  {
    key: 'scheduledAt',
    header: 'Коли відправити',
    width: '16%',
    nowrap: true,
    render: (item) => formatDateTime(item.scheduledAt),
  },
  {
    key: 'kind',
    header: 'Дія',
    width: '18%',
    filter: { type: 'multi', param: 'kind', options: KIND_OPTIONS },
    render: (item) => (
      <span>
        {item.kindLabel}
        <span className="muted" style={{ display: 'block' }}>
          {item.audienceLabel}
        </span>
      </span>
    ),
  },
  {
    key: 'email',
    header: 'Кому',
    width: '20%',
    filter: { type: 'text', param: 'cronEmail', placeholder: 'Email…' },
    render: (item) =>
      item.user ? (
        <Link href={`/users/${item.user.id}`} className="mailing-user-link" onClick={(event) => event.stopPropagation()}>
          <b>{item.user.name || item.user.email}</b>
          <span>{item.email}</span>
        </Link>
      ) : (
        item.email
      ),
  },
  {
    key: 'lesson',
    header: 'Урок',
    width: '12%',
    render: (item) => (item.lesson ? `№${item.lesson.number}` : '—'),
  },
  {
    key: 'status',
    header: 'Статус',
    width: '14%',
    nowrap: true,
    filter: { type: 'multi', param: 'cronStatus', options: TASK_STATUS_OPTIONS },
    render: (item) => <span className={`status-pill${taskStatusClass(item)}`}>{item.statusLabel}</span>,
  },
  {
    key: 'processedAt',
    header: 'Оброблено',
    width: '12%',
    nowrap: true,
    render: (item) => (item.processedAt ? formatDateTime(item.processedAt) : '—'),
  },
  {
    key: 'details',
    header: 'Деталі',
    width: '8%',
    nowrap: true,
    render: (item) => <CronTaskDetails item={item} />,
  },
];

const runColumns: Column<MailingCronRun>[] = [
    {
      key: 'startedAt',
      header: 'Старт',
      width: '16%',
      nowrap: true,
      render: (item) => formatDateTime(item.startedAt),
    },
    {
      key: 'action',
      header: 'Воркер',
      width: '16%',
      render: (item) => item.actionLabel,
    },
    {
      key: 'status',
      header: 'Статус',
      width: '12%',
      nowrap: true,
      filter: { type: 'multi', param: 'runStatus', options: RUN_STATUS_OPTIONS },
      render: (item) => <span className={`status-pill${runStatusClass(item)}`}>{item.statusLabel}</span>,
    },
    {
      key: 'result',
      header: 'Результат',
      width: '36%',
      render: (item) => (
        <span className="muted">
          {item.scanned} уроків · {item.enqueued} у чергу · {item.sent} надіслано · {item.failed} помилок
          {item.overdue ? ` · ${item.overdue} прострочено` : ''}
        </span>
      ),
    },
    {
      key: 'finishedAt',
      header: 'Завершено',
      width: '14%',
      nowrap: true,
      render: (item) => (item.finishedAt ? formatDateTime(item.finishedAt) : '—'),
    },
    {
      key: 'details',
      header: 'Деталі',
      width: '6%',
      nowrap: true,
      render: (item) => <CronRunDetails item={item} />,
    },
  ];

const TASK_FILTER_PARAMS = ['kind', 'cronEmail', 'cronStatus'];

export function MailingsCronView() {
  const [innerTab, setInnerTab] = useState<CronInnerTab>('runs');
  const [runs, setRuns] = useState<Paginated<MailingCronRun>>(() => emptyRuns(10));
  const [runPage, setRunPage] = useState(1);
  const [runLimit, setRunLimit] = useState(10);
  const [runFilters, setRunFilters] = useState<Record<string, string>>({ runStatus: '' });
  const [runsLoading, setRunsLoading] = useState(true);
  const [runsError, setRunsError] = useState('');

  const tasks = usePaginatedList<MailingTask>(
    '/modules/mailings',
    (query) =>
      mailingsApi.tasks({
        page: query.page,
        limit: query.limit,
        kind: query.filters.kind,
        email: query.filters.cronEmail,
        status: query.filters.cronStatus,
      }),
    TASK_FILTER_PARAMS,
  );

  const loadRuns = useCallback(() => {
    setRunsLoading(true);
    return mailingsApi
      .cronRuns({
        page: runPage,
        limit: runLimit,
        status: runFilters.runStatus || undefined,
      })
      .then((payload) => {
        setRunsError('');
        setRuns(payload);
      })
      .catch((err: unknown) => setRunsError(err instanceof Error ? err.message : 'Не вдалося завантажити запуски'))
      .finally(() => setRunsLoading(false));
  }, [runPage, runLimit, runFilters.runStatus]);

  useEffect(() => {
    loadRuns().catch(() => undefined);
  }, [loadRuns]);

  function setRunFilter(param: string, value: string) {
    setRunFilters((current) => ({ ...current, [param]: value }));
    setRunPage(1);
  }

  function resetRuns() {
    setRunFilters({ runStatus: '' });
    setRunPage(1);
    setRunLimit(10);
  }

  const hasRunFilters = Boolean(runFilters.runStatus);

  return (
    <>
      <div className="tab-row mailings-cron-tabs">
        <button
          className={`tab${innerTab === 'runs' ? ' active' : ''}`}
          type="button"
          onClick={() => setInnerTab('runs')}
        >
          Запуски воркера
        </button>
        <button
          className={`tab${innerTab === 'tasks' ? ' active' : ''}`}
          type="button"
          onClick={() => setInnerTab('tasks')}
        >
          Черга завдань
        </button>
      </div>

      <FormAlerts error={innerTab === 'runs' ? runsError : tasks.error} />

      {innerTab === 'runs' ? (
        <DataTable
          columns={runColumns}
          items={runs.items}
          rowKey={(item) => item.id}
          loading={runsLoading}
          emptyText="Ще не було запусків cron"
          columnFilters={{ values: runFilters, onChange: setRunFilter }}
          onReset={resetRuns}
          hasActiveFilters={hasRunFilters}
          pagination={{
            page: runs.page,
            pageCount: runs.pageCount,
            total: runs.total,
            limit: runLimit,
            onPageChange: setRunPage,
            onLimitChange: (limit) => {
              setRunLimit(limit);
              setRunPage(1);
            },
          }}
        />
      ) : (
        <DataTable
          columns={taskColumns}
          items={tasks.items}
          rowKey={(item) => item.id}
          loading={tasks.loading}
          emptyText="Ще немає запланованих cron-дій"
          columnFilters={{ values: tasks.filters, onChange: tasks.setFilter }}
          onReset={tasks.reset}
          hasActiveFilters={tasks.hasActiveFilters}
          pagination={{
            page: tasks.data.page,
            pageCount: tasks.data.pageCount,
            total: tasks.data.total,
            limit: tasks.limit,
            onPageChange: tasks.setPage,
            onLimitChange: tasks.setLimit,
          }}
        />
      )}
    </>
  );
}
