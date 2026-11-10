'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { pagePath } from '@/lib/format';
import { pagesApi } from '../api';
import { seoReady, type PageRow } from '../types';
import { CreatePageButton } from './CreatePageButton';

const SEO_OPTIONS = [
  { value: 'ready', label: 'Заповнено' },
  { value: 'incomplete', label: 'Неповне' },
];

const FILTER_PARAMS = ['title', 'slug', 'seo'];

const columns: Column<PageRow>[] = [
  {
    key: 'page',
    header: 'Сторінка',
    filter: { type: 'text', param: 'title', placeholder: 'Назва…' },
    render: (item) => (
      <div className="student-cell">
        <div className="mini-av">
          <FileText size={14} />
        </div>
        <div>
          <div className="student-name">{item.title}</div>
          <div className="student-email">{item.seo?.title || 'SEO title ще не задано'}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'slug',
    header: 'Slug',
    width: '16.6667vw',
    filter: { type: 'text', param: 'slug', placeholder: 'Slug…' },
    render: (item) => <span className="mono">{pagePath(item.slug)}</span>,
  },
  {
    key: 'seo',
    header: 'SEO',
    width: '12.1528vw',
    filter: { type: 'multi', param: 'seo', options: SEO_OPTIONS },
    render: (item) => (
      <span className={`status-pill ${seoReady(item) ? 'status-active' : 'status-pause'}`}>
        {seoReady(item) ? 'Заповнено' : 'Неповне'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    header: 'Створено',
    width: '10.4167vw',
    render: (item) => new Date(item.createdAt).toLocaleDateString('uk-UA'),
  },
];

function PagesList() {
  const router = useRouter();
  const list = usePaginatedList<PageRow>(
    '/pages',
    (query) =>
      pagesApi.list({
        page: query.page,
        limit: query.limit,
        ...query.filters,
      }),
    FILTER_PARAMS,
  );

  return (
    <>
      <PageHead
        title="Сторінки"
        description="Сторінки для виводу на сайті. Спільні поля й SEO — у картці сторінки."
        actions={<CreatePageButton />}
      />

      <FormAlerts error={list.error} />

      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        onRowClick={(item) => router.push(`/pages/${item.id}`)}
        loading={list.loading}
        emptyText="Сторінки не знайдено"
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

export function PagesListView() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <PagesList />
    </Suspense>
  );
}
