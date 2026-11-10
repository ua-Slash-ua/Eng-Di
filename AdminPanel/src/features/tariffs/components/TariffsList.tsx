'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { formatUah } from '@/lib/format';
import { tariffsApi } from '../api';
import { VARIANT_LABELS, VARIANT_OPTIONS, type TariffListItem } from '../types';
import { CreateTariffButton } from './CreateTariffButton';

const columns: Column<TariffListItem>[] = [
  {
    key: 'title',
    header: 'Пакет',
    sortKey: 'title',
    filter: { type: 'text', param: 'title', placeholder: 'Назва пакета…' },
    render: (item) => (
      <>
        <div className="student-name">
          {item.title}
          {item.popular ? ' · популярний' : ''}
        </div>
        <div className="student-email">{item.note}</div>
      </>
    ),
  },
  {
    key: 'price',
    header: 'Ціна',
    sortKey: 'price',
    width: '15.9722vw',
    render: (item) => (
      <span className="mono">
        {formatUah(item.price)} грн
        {item.oldPrice ? ` · було ${formatUah(item.oldPrice)}` : ''}
      </span>
    ),
  },
  { key: 'lessons', header: 'Уроків', sortKey: 'lessons', width: '8.3333vw', render: (item) => item.lessons },
  {
    key: 'frozen',
    header: 'Заморозки',
    width: '9.0278vw',
    render: (item) => item.frozenLessonsPerMonth || '—',
  },
  {
    key: 'variant',
    header: 'Стиль',
    sortKey: 'variant',
    width: '12.1528vw',
    filter: { type: 'multi', param: 'variant', options: VARIANT_OPTIONS },
    render: (item) => VARIANT_LABELS[item.variant] || item.variant,
  },
];

const FILTER_PARAMS = ['title', 'variant'];

function TariffsListView() {
  const router = useRouter();
  const list = usePaginatedList<TariffListItem>(
    '/tariffs',
    (query) =>
      tariffsApi.list({
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
        title="Тарифи"
        description="Незалежні пакети: ціна, знижка, популярний вибір. Один запис можна потім ставити в різні блоки."
        actions={<CreateTariffButton onCreated={() => void list.reload()} />}
      />
      <FormAlerts error={list.error} />
      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        loading={list.loading}
        onRowClick={(item) => router.push(`/tariffs/${item.id}`)}
        emptyText="Тарифи не знайдено"
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

export function TariffsList() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <TariffsListView />
    </Suspense>
  );
}
