'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/components/MetaBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { authAdminApi } from '../api';
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_OPTIONS,
  PANEL_OPTIONS,
  type AuthEvent,
  type AuthSession,
  type AuthSummary,
} from '../types';

const EVENT_FILTERS = ['type', 'panel', 'path'];

function ActivityStats() {
  const [stats, setStats] = useState<AuthSummary | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    authAdminApi.summary().then(setStats).catch(() => undefined);
  }, []);

  async function reload() {
    setStats(await authAdminApi.summary());
  }

  async function run(action: string, fn: () => Promise<string>) {
    setBusy(action);
    setError('');
    setOk('');
    try {
      setOk(await fn());
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося виконати дію');
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <PageHead
        title="Активність"
        description="Входи, сесії, перегляди головної та кабінету. Дані збираються для подальшої аналітики."
        actions={
          <>
            <button
              className="btn-outline"
              type="button"
              disabled={Boolean(busy)}
              onClick={() => {
                if (!window.confirm('Завершити всі сесії, крім поточної?')) return;
                void run('logout', async () => {
                  await authAdminApi.logoutAll();
                  return 'Усіх користувачів розлогінено';
                });
              }}
            >
              {busy === 'logout' ? 'Вихід…' : 'Розлогінити всіх'}
            </button>
            <button
              className="btn"
              type="button"
              disabled={Boolean(busy)}
              onClick={() =>
                void run('unblock', async () => {
                  const data = await authAdminApi.unblockAll();
                  return `Авторизовано акаунтів: ${data.count}`;
                })
              }
            >
              {busy === 'unblock' ? 'Авторизація…' : 'Авторизувати всіх'}
            </button>
          </>
        }
      />
      <FormAlerts error={error} ok={ok} />
      <div className="stats stats-2">
        <div className="stat-card">
          <div className="top-row">
            <span className="stat-label">Входи сьогодні</span>
          </div>
          <div className="stat-value">{stats?.loginsToday ?? '—'}</div>
          <div className="stat-delta up">за тиждень: {stats?.loginsWeek ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="top-row">
            <span className="stat-label">Активні сесії</span>
          </div>
          <div className="stat-value">{stats?.activeSessions ?? '—'}</div>
          <div className="stat-delta" style={{ color: 'var(--text-soft)' }}>
            невдалі входи сьогодні: {stats?.failedLoginsToday ?? '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="top-row">
            <span className="stat-label">Перегляди</span>
          </div>
          <div className="stat-value">{stats ? stats.homeViews + stats.cabinetViews : '—'}</div>
          <div className="stat-delta" style={{ color: 'var(--text-soft)' }}>
            головна {stats?.homeViews ?? '—'} · кабінет {stats?.cabinetViews ?? '—'}
          </div>
        </div>
      </div>
    </>
  );
}

const sessionColumns: Column<AuthSession>[] = [
  {
    key: 'user',
    header: 'Користувач',
    render: (item) => (
      <div>
        <div className="student-name">{item.user?.name || 'Без імені'}</div>
        <div className="student-email">{item.user?.email}</div>
      </div>
    ),
  },
  {
    key: 'panel',
    header: 'Панель',
    width: '9.7222vw',
    render: (item) => (item.panel === 'admin' ? 'Адмінка' : 'Кабінет'),
  },
  {
    key: 'ip',
    header: 'IP',
    width: '11.1111vw',
    render: (item) => item.ip || '—',
  },
  {
    key: 'lastUsedAt',
    header: 'Остання активність',
    width: '13.8889vw',
    render: (item) => formatDateTime(item.lastUsedAt),
  },
];

const eventColumns: Column<AuthEvent>[] = [
  {
    key: 'createdAt',
    header: 'Час',
    width: '12.5vw',
    render: (item) => formatDateTime(item.createdAt),
  },
  {
    key: 'type',
    header: 'Подія',
    width: '13.8889vw',
    filter: { type: 'multi', param: 'type', options: EVENT_TYPE_OPTIONS },
    render: (item) => EVENT_TYPE_LABELS[item.type] || item.type,
  },
  {
    key: 'user',
    header: 'Користувач',
    render: (item) => item.user?.email || (item.userId ? `#${item.userId}` : 'Гість'),
  },
  {
    key: 'panel',
    header: 'Панель',
    width: '9.0278vw',
    filter: { type: 'multi', param: 'panel', options: PANEL_OPTIONS },
    render: (item) => (item.panel === 'admin' ? 'Адмінка' : item.panel === 'user' ? 'Кабінет' : '—'),
  },
  {
    key: 'path',
    header: 'Шлях',
    width: '11.1111vw',
    filter: { type: 'text', param: 'path', placeholder: '/cabinet…' },
    render: (item) => item.path || '—',
  },
];

function SessionsTable() {
  const router = useRouter();
  const [items, setItems] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    authAdminApi
      .sessions({ page: 1, limit: 20 })
      .then((data) => setItems(data.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Активні сесії</h3>
      </div>
      <FormAlerts error={error} />
      <DataTable
        columns={sessionColumns}
        items={items}
        rowKey={(item) => item.id}
        onRowClick={(item) => router.push(`/users/${item.userId}`)}
        loading={loading}
        emptyText="Немає активних сесій"
      />
    </div>
  );
}

function EventsTable() {
  const router = useRouter();
  const list = usePaginatedList<AuthEvent>(
    '/users/activity',
    (query) =>
      authAdminApi.events({
        page: query.page,
        limit: query.limit,
        ...query.filters,
      }),
    EVENT_FILTERS,
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Журнал подій</h3>
      </div>
      <FormAlerts error={list.error} />
      <DataTable
        columns={eventColumns}
        items={list.items}
        rowKey={(item) => item.id}
        onRowClick={(item) => {
          if (item.userId) router.push(`/users/${item.userId}`);
        }}
        loading={list.loading}
        emptyText="Подій ще немає"
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
    </div>
  );
}

function ActivityPage() {
  return (
    <>
      <ActivityStats />
      <SessionsTable />
      <EventsTable />
    </>
  );
}

export function ActivityView() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <ActivityPage />
    </Suspense>
  );
}
