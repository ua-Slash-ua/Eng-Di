'use client';

import { Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { faqsApi } from '../api';
import type { FaqItem } from '../types';
import { CreateFaqButton } from './CreateFaqButton';

const FILTER_PARAMS = ['question'];

function FaqListView() {
  const router = useRouter();
  const list = usePaginatedList<FaqItem>(
    '/faq',
    (query) =>
      faqsApi.list({
        q: query.q,
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        order: query.order,
        ...query.filters,
      }),
    FILTER_PARAMS,
  );

  const offset = (list.data.page - 1) * list.data.limit;
  const columns = useMemo<Column<FaqItem>[]>(
    () => [
      {
        key: 'question',
        header: 'Питання',
        sortKey: 'question',
        filter: { type: 'text', param: 'question', placeholder: 'Питання або відповідь…' },
        render: (item, index) => (
          <>
            <div className="student-name">
              {offset + index + 1}. {item.question}
            </div>
            <div className="student-email">{item.answer}</div>
          </>
        ),
      },
      {
        key: 'updatedAt',
        header: 'Оновлено',
        width: '11.8056vw',
        render: (item) => new Date(item.updatedAt).toLocaleDateString('uk-UA'),
      },
    ],
    [offset],
  );

  return (
    <>
      <PageHead
        title="FAQ"
        description="Питання та відповіді. Порядок на сайті — за порядком у списку."
        actions={<CreateFaqButton onCreated={() => void list.reload()} />}
      />
      <FormAlerts error={list.error} />
      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        loading={list.loading}
        onRowClick={(item) => router.push(`/faq/${item.id}`)}
        emptyText="Питання не знайдено"
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

export function FaqList() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <FaqListView />
    </Suspense>
  );
}
