'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { formatsApi } from '../api';
import { ACCENT_LABELS, ACCENT_OPTIONS, type FormatListItem } from '../types';
import { CreateFormatButton } from './CreateFormatButton';

const columns: Column<FormatListItem>[] = [
  {
    key: 'title',
    header: 'Назва',
    sortKey: 'title',
    filter: { type: 'text', param: 'title', placeholder: 'Назва…' },
    render: (item) => (
      <>
        <div className="student-name">{item.title}</div>
        <div className="student-email">{item.description}</div>
      </>
    ),
  },
  {
    key: 'icon',
    header: 'Іконка',
    sortKey: 'icon',
    width: '11.1111vw',
    filter: { type: 'text', param: 'icon', placeholder: 'Іконка…' },
    render: (item) => (item.icon ? <SvgIcon svg={item.icon} size={22} /> : '—'),
  },
  {
    key: 'accent',
    header: 'Колір',
    sortKey: 'accent',
    width: '13.1944vw',
    filter: { type: 'multi', param: 'accent', options: ACCENT_OPTIONS },
    render: (item) => ACCENT_LABELS[item.accent] || item.accent,
  },
];

const FILTER_PARAMS = ['title', 'icon', 'accent'];

function FormatsListView() {
  const router = useRouter();
  const list = usePaginatedList<FormatListItem>(
    '/formats',
    (query) =>
      formatsApi.list({
        q: query.q,
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        order: query.order,
        ...query.filters,
      }),
    FILTER_PARAMS,
  );

  return (
    <>
      <PageHead
        title="Формати"
        description="Незалежні картки: іконка, назва, опис. Потім оберете, в яких блоках їх показувати."
        actions={<CreateFormatButton onCreated={() => void list.reload()} />}
      />
      <FormAlerts error={list.error} />
      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        loading={list.loading}
        onRowClick={(item) => router.push(`/formats/${item.id}`)}
        emptyText="Формати не знайдено"
        sort={{ sort: list.sort, order: list.order, onToggle: list.toggleSort }}
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

export function FormatsList() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <FormatsListView />
    </Suspense>
  );
}
