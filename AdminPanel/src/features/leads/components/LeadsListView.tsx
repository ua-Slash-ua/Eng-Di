'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { pagePath } from '@/lib/format';
import { leadCategoriesApi, leadsApi } from '../api';
import { LEAD_STATUS_LABELS, LEAD_STATUS_OPTIONS, type Lead, type LeadCategory } from '../types';

const FILTER_PARAMS = ['lead', 'category', 'location', 'status'];

function LeadsList() {
  const router = useRouter();
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const list = usePaginatedList<Lead>(
    '/leads',
    (query) =>
      leadsApi.list({
        page: query.page,
        limit: query.limit,
        ...query.filters,
      }),
    FILTER_PARAMS,
  );

  useEffect(() => {
    leadCategoriesApi.list().then(setCategories).catch(() => undefined);
  }, []);

  const columns = useMemo<Column<Lead>[]>(
    () => [
      {
        key: 'lead',
        header: 'Заявка',
        filter: { type: 'text', param: 'lead', placeholder: 'Імʼя або телефон…' },
        render: (item) => (
          <>
            <div className="student-name">{item.name}</div>
            <div className="student-email">{item.phone}</div>
          </>
        ),
      },
      {
        key: 'category',
        header: 'Категорія',
        width: '13.8889vw',
        filter: {
          type: 'multi',
          param: 'category',
          options: categories.map((item) => ({ value: item.slug, label: item.title })),
        },
        render: (item) => item.category?.title || '—',
      },
      {
        key: 'page',
        header: 'Сторінка',
        width: '13.8889vw',
        filter: { type: 'text', param: 'location', placeholder: 'Сторінка…' },
        render: (item) => <span className="mono">{pagePath(item.location || '/')}</span>,
      },
      {
        key: 'status',
        header: 'Статус',
        width: '12.1528vw',
        filter: { type: 'multi', param: 'status', options: LEAD_STATUS_OPTIONS },
        render: (item) => (
          <span
            className={`status-pill ${item.status === 'NEW' ? 'status-review' : item.status === 'DONE' ? 'status-active' : 'status-pause'}`}
          >
            {LEAD_STATUS_LABELS[item.status]}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Дата',
        width: '12.8472vw',
        render: (item) => new Date(item.createdAt).toLocaleString('uk-UA'),
      },
    ],
    [categories],
  );

  return (
    <>
      <PageHead
        title="Заявки"
        description="Категорія як у CPT і сторінка, з якої надіслали форму."
        actions={
          <Link href="/leads/categories" className="btn-outline">
            Категорії
          </Link>
        }
      />
      <FormAlerts error={list.error} />
      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        onRowClick={(item) => router.push(`/leads/${item.id}`)}
        loading={list.loading}
        emptyText="Заявок не знайдено"
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

export function LeadsListView() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <LeadsList />
    </Suspense>
  );
}
