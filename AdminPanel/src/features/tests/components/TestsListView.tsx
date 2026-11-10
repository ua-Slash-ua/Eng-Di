'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormAlerts, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useTableQuery } from '@/hooks/useTableQuery';
import { testsApi } from '../api';
import { DURATION_LABELS, KIND_LABELS, type TestItem, type TestKind } from '../types';

const KIND_OPTIONS = [
  { value: 'free', label: 'Вільний' },
  { value: 'material', label: 'Для матеріалу' },
];

function TestsListInner() {
  const router = useRouter();
  const [items, setItems] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const query = useTableQuery('/materials/tests', ['title', 'kind']);

  useEffect(() => {
    setLoading(true);
    testsApi
      .list()
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const title = query.filters.title.trim().toLowerCase();
    const kind = query.filters.kind as TestKind | '';
    return items.filter((item) => {
      if (title && !item.title.toLowerCase().includes(title)) return false;
      if (kind && item.kind !== kind) return false;
      return true;
    });
  }, [items, query.filters]);

  const columns = useMemo<Column<TestItem>[]>(
    () => [
      {
        key: 'title',
        header: 'Назва',
        filter: { type: 'text', param: 'title', placeholder: 'Назва…' },
        render: (item) => (
          <>
            <div className="student-name">{item.title}</div>
            {item.description ? <div className="student-email">{item.description}</div> : null}
          </>
        ),
      },
      {
        key: 'kind',
        header: 'Тип',
        width: '9.7222vw',
        filter: { type: 'select', param: 'kind', options: KIND_OPTIONS, placeholder: 'Усі' },
        render: (item) => (
          <span className={`status-pill ${item.kind === 'free' ? 'status-review' : 'status-active'}`}>
            {KIND_LABELS[item.kind]}
          </span>
        ),
      },
      {
        key: 'duration',
        header: 'Доступ',
        width: '9.7222vw',
        render: (item) => DURATION_LABELS[item.accessDuration],
      },
      {
        key: 'questions',
        header: 'Питань',
        width: '6.9444vw',
        render: (item) => item._count?.questions ?? item.questions?.length ?? 0,
      },
      {
        key: 'attempts',
        header: 'Спроб',
        width: '6.9444vw',
        render: (item) => item._count?.attempts ?? 0,
      },
      {
        key: 'password',
        header: 'Пароль',
        width: '9.7222vw',
        render: (item) => <code>{item.entryPassword}</code>,
      },
      {
        key: 'updatedAt',
        header: 'Оновлено',
        width: '9.7222vw',
        render: (item) => new Date(item.updatedAt).toLocaleDateString('uk-UA'),
      },
    ],
    [],
  );

  return (
    <>
      <PageHead
        title="Тести"
        description="Вільні тести та тести для матеріалів."
        actions={
          <button className="btn" type="button" onClick={() => router.push('/materials/tests/new')}>
            + Створити
          </button>
        }
      />
      <FormAlerts error={error} />
      {loading ? (
        <LoadingState />
      ) : (
        <DataTable
          columns={columns}
          items={filtered}
          rowKey={(item) => item.id}
          onRowClick={(item) => router.push(`/materials/tests/${item.id}`)}
          emptyText="Тестів не знайдено"
          columnFilters={{ values: query.filters, onChange: query.setFilter }}
          onReset={query.reset}
          hasActiveFilters={query.hasActiveFilters}
        />
      )}
    </>
  );
}

export function TestsListView() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TestsListInner />
    </Suspense>
  );
}
