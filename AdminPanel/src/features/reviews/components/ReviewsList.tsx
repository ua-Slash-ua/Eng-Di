'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { reviewsApi } from '../api';
import {
  KIND_OPTIONS,
  RATING_OPTIONS,
  TARGET_LABELS,
  VERIFIED_OPTIONS,
  reviewKindLabel,
  reviewStatusLabel,
  type ReviewListItem,
} from '../types';
import { CreateReviewButton } from './CreateReviewButton';

const columns: Column<ReviewListItem>[] = [
  {
    key: 'review',
    header: 'Відгук',
    sortKey: 'author',
    filter: { type: 'text', param: 'author', placeholder: 'Імʼя або текст…' },
    render: (item) => (
      <>
        <div className="student-name">{item.author}</div>
        <div className="student-email">
          {TARGET_LABELS[item.target]}
          {item.teacher ? ` · ${item.teacher.name}` : ''} · {item.result} · {item.quote}
        </div>
      </>
    ),
  },
  {
    key: 'kind',
    header: 'Тип',
    width: '10vw',
    filter: { type: 'multi', param: 'kind', options: KIND_OPTIONS },
    render: (item) => reviewKindLabel(item.kind),
  },
  {
    key: 'status',
    header: 'Статус',
    width: '12vw',
    filter: { type: 'multi', param: 'verified', options: VERIFIED_OPTIONS },
    render: (item) => (
      <span>{reviewStatusLabel(item)}</span>
    ),
  },
  {
    key: 'rating',
    header: 'Оцінка',
    sortKey: 'rating',
    width: '8vw',
    filter: { type: 'multi', param: 'rating', options: RATING_OPTIONS },
    render: (item) => '★'.repeat(item.rating),
  },
];

const FILTER_PARAMS = ['author', 'rating', 'kind', 'verified'];

function ReviewsListView() {
  const router = useRouter();
  const list = usePaginatedList<ReviewListItem>(
    '/reviews',
    (query) =>
      reviewsApi.list({
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
        title="Відгуки"
        description="Ручні відгуки та відгуки учнів. Учнівські проходять модерацію перед публікацією на сайті."
        actions={<CreateReviewButton onCreated={() => void list.reload()} />}
      />
      <FormAlerts error={list.error} />
      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        loading={list.loading}
        onRowClick={(item) => router.push(`/reviews/${item.id}`)}
        emptyText="Відгуки не знайдено"
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

export function ReviewsList() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <ReviewsListView />
    </Suspense>
  );
}
