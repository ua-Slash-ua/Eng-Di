'use client';

import { Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { rulesApi } from '../api';
import { ACCENT_LABELS, ACCENT_OPTIONS, type RuleListItem } from '../types';
import { CreateRuleButton } from './CreateRuleButton';

const FILTER_PARAMS = ['title', 'accent'];

function RulesListView() {
  const router = useRouter();
  const list = usePaginatedList<RuleListItem>(
    '/rules',
    (query) =>
      rulesApi.list({
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
  const columns = useMemo<Column<RuleListItem>[]>(
    () => [
      {
        key: 'title',
        header: 'Правило',
        sortKey: 'title',
        filter: { type: 'text', param: 'title', placeholder: 'Заголовок…' },
        render: (item, index) => (
          <>
            <div className="student-name">
              {offset + index + 1}. {item.title}
            </div>
            <div className="student-email">{item.description}</div>
          </>
        ),
      },
      {
        key: 'accent',
        header: 'Колір номера',
        sortKey: 'accent',
        width: '13.8889vw',
        filter: { type: 'multi', param: 'accent', options: ACCENT_OPTIONS },
        render: (item) => ACCENT_LABELS[item.accent] || item.accent,
      },
    ],
    [offset],
  );

  return (
    <>
      <PageHead
        title="Правила"
        description="Незалежні пункти: заголовок і короткий текст. Потім оберете й розставите їх у блоках."
        actions={<CreateRuleButton onCreated={() => void list.reload()} />}
      />
      <FormAlerts error={list.error} />
      <DataTable
        columns={columns}
        items={list.items}
        rowKey={(item) => item.id}
        loading={list.loading}
        onRowClick={(item) => router.push(`/rules/${item.id}`)}
        emptyText="Правила не знайдено"
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

export function RulesList() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <RulesListView />
    </Suspense>
  );
}
