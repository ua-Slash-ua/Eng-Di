'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { formatUserAccess } from '@/lib/permissions';
import { initials } from '@/lib/format';
import { usersApi } from '../api';
import {
  ADMIN_ACCESS_OPTIONS,
  STATUS_OPTIONS,
  USER_ROLE_LABELS,
  USER_ROLE_OPTIONS,
  type User,
} from '../types';
import { CreateUserButton } from './CreateUserButton';

const ACCESS_FILTER_OPTIONS = [
  ...USER_ROLE_OPTIONS.filter((item) => item.value),
  { value: 'super_admin', label: 'Супер-адмін' },
  { value: 'admin', label: 'Адмін (роль)' },
];

const columns: Column<User>[] = [
  {
    key: 'user',
    header: 'Користувач',
    width: '34%',
    filter: { type: 'text', param: 'user', placeholder: 'Імʼя або email…' },
    render: (item) => (
      <div className="student-cell">
        <div className="mini-av">{initials(item.name, item.email)}</div>
        <div>
          <div className="student-name">{item.name || 'Без імені'}</div>
          <div className="student-email">{item.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'phone',
    header: 'Телефон',
    width: '10%',
    nowrap: true,
    filter: { type: 'text', param: 'phone', placeholder: 'Телефон…' },
    render: (item) => item.phone || '—',
  },
  {
    key: 'access',
    header: 'Доступ',
    width: '14%',
    nowrap: true,
    filter: { type: 'multi', param: 'role', options: ACCESS_FILTER_OPTIONS },
    render: (item) => (
      <span className={`status-pill ${item.userRole ? 'status-active' : item.isSuperAdmin || item.adminRole ? 'status-review' : ''}`}>
        {formatUserAccess(item)}
      </span>
    ),
  },
  {
    key: 'cabinet',
    header: 'Кабінет',
    width: '8%',
    nowrap: true,
    render: (item) => (item.userRole ? USER_ROLE_LABELS[item.userRole] : '—'),
  },
  {
    key: 'status',
    header: 'Статус',
    width: '10%',
    nowrap: true,
    filter: { type: 'multi', param: 'status', options: STATUS_OPTIONS },
    render: (item) => (
      <span className={`status-pill ${item.status === 'blocked' ? 'status-review' : 'status-active'}`}>
        {item.status === 'blocked' ? 'Заблокований' : 'Активний'}
      </span>
    ),
  },
  {
    key: 'activation',
    header: 'Активація',
    width: '14%',
    nowrap: true,
    render: (item) =>
      item.isActivated ? (
        <span className="status-pill status-active">Активований</span>
      ) : (
        <span className="status-pill status-review" title="Тимчасовий пароль — на картці користувача">
          Не активований
        </span>
      ),
  },
  {
    key: 'createdAt',
    header: 'Створено',
    width: '10%',
    nowrap: true,
    render: (item) => new Date(item.createdAt).toLocaleDateString('uk-UA'),
  },
];

const FILTER_PARAMS = ['user', 'phone', 'role', 'status'];

function UsersList() {
  const router = useRouter();
  const list = usePaginatedList<User>(
    '/users',
    (query) =>
      usersApi.list({
        page: query.page,
        limit: query.limit,
        ...query.filters,
      }),
    FILTER_PARAMS,
  );

  return (
    <>
      <PageHead
        title="Користувачі"
        description="Учні та адміністратори. Клік по рядку відкриває картку."
        actions={<CreateUserButton onCreated={() => void list.reload()} />}
      />

      <FormAlerts error={list.error} />

      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        onRowClick={(item) => router.push(`/users/${item.id}`)}
        loading={list.loading}
        emptyText="Користувачів не знайдено"
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

export function UsersListView() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <UsersList />
    </Suspense>
  );
}
