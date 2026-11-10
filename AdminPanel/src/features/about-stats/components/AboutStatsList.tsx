'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { aboutStatsApi } from '../api';
import type { AboutStatListItem } from '../types';
import { CreateAboutStatButton } from './CreateAboutStatButton';

const columns: Column<AboutStatListItem>[] = [
  {
    key: 'value',
    header: 'Значення',
    sortKey: 'value',
    width: '15.2778vw',
    filter: { type: 'text', param: 'value', placeholder: 'Значення…' },
    render: (item) => <span className="student-name">{item.value}</span>,
  },
  {
    key: 'label',
    header: 'Підпис',
    sortKey: 'label',
    filter: { type: 'text', param: 'label', placeholder: 'Підпис…' },
    render: (item) => item.label,
  },
  {
    key: 'icon',
    header: 'Іконка',
    sortKey: 'icon',
    width: '11.1111vw',
    filter: { type: 'text', param: 'icon', placeholder: 'Іконка…' },
    render: (item) => (item.icon ? <SvgIcon svg={item.icon} size={22} /> : '—'),
  },
];

const FILTER_PARAMS = ['value', 'label', 'icon'];

function AboutStatsListView() {
  const router = useRouter();
  const list = usePaginatedList<AboutStatListItem>(
    '/about-stats',
    (query) =>
      aboutStatsApi.list({
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
        title="Цифри про нас"
        description="Значення, підпис і за потреби іконка. На сайт потраплять ті записи, які оберете пізніше."
        actions={<CreateAboutStatButton onCreated={() => void list.reload()} />}
      />
      <FormAlerts error={list.error} />
      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        loading={list.loading}
        onRowClick={(item) => router.push(`/about-stats/${item.id}`)}
        emptyText="Записи не знайдено"
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

export function AboutStatsList() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <AboutStatsListView />
    </Suspense>
  );
}
