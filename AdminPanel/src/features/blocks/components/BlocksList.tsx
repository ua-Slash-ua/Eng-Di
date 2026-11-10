'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { blocksApi } from '../api';
import { BLOCK_TYPE_LABELS, BLOCK_TYPE_OPTIONS, type BlockListItem } from '../types';
import { CreateBlockButton } from './CreateBlockButton';

const columns: Column<BlockListItem>[] = [
  {
    key: 'name',
    header: 'Назва в адмінці',
    sortKey: 'name',
    filter: { type: 'text', param: 'name', placeholder: 'Назва…' },
    render: (item) => <span className="student-name">{item.name}</span>,
  },
  {
    key: 'type',
    header: 'Тип',
    width: '12.5vw',
    filter: { type: 'select', param: 'type', options: BLOCK_TYPE_OPTIONS },
    render: (item) => BLOCK_TYPE_LABELS[item.type] || item.type,
  },
  {
    key: 'plaque',
    header: 'Плашка',
    sortKey: 'plaque',
    width: '35%',
    filter: { type: 'text', param: 'plaque', placeholder: 'Плашка…' },
    render: (item) => item.plaque || '—',
  },
];

const FILTER_PARAMS = ['name', 'type', 'plaque'];

function BlocksListView() {
  const router = useRouter();
  const list = usePaginatedList<BlockListItem>(
    '/blocks',
    (query) =>
      blocksApi.list({
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
        title="Блоки"
        description="Незалежні блоки з полями під тип. Назву бачите лише ви — потім оберете блок на сторінці."
        actions={<CreateBlockButton />}
      />
      <FormAlerts error={list.error} />
      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        loading={list.loading}
        onRowClick={(item) => router.push(`/blocks/${item.id}`)}
        emptyText="Блоки не знайдено"
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

export function BlocksList() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <BlocksListView />
    </Suspense>
  );
}
