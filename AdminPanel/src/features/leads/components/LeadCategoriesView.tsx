'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { leadCategoriesApi } from '../api';
import type { LeadCategory } from '../types';
import { CreateLeadCategoryButton } from './CreateLeadCategoryButton';

export function LeadCategoriesView() {
  const [items, setItems] = useState<LeadCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await leadCategoriesApi.list());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  const onDelete = useCallback(
    async (id: number) => {
      setError('');
      try {
        await leadCategoriesApi.remove(id);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не вдалося видалити');
      }
    },
    [reload],
  );

  const columns = useMemo<Column<LeadCategory>[]>(
    () => [
      {
        key: 'title',
        header: 'Назва',
        render: (item) => <span className="student-name">{item.title}</span>,
      },
      {
        key: 'slug',
        header: 'Slug',
        width: '16.6667vw',
        render: (item) => <span className="mono">{item.slug}</span>,
      },
      {
        key: 'count',
        header: 'Заявок',
        width: '8.3333vw',
        render: (item) => item._count?.leads ?? 0,
      },
      {
        key: 'actions',
        header: '',
        width: '11.1111vw',
        render: (item) =>
          item.slug === 'site' ? (
            <span className="muted">базова</span>
          ) : (
            <button
              className="btn-outline"
              type="button"
              style={{ padding: '0.4167vw 0.8333vw' }}
              onClick={(event) => {
                event.stopPropagation();
                void onDelete(item.id);
              }}
            >
              Видалити
            </button>
          ),
      },
    ],
    [onDelete],
  );

  return (
    <>
      <PageHead
        backHref="/leads"
        backLabel="До заявок"
        title="Категорії заявок"
        description="Таксономія для лідів, як категорії CPT. Форма на сайті шле slug категорії."
        actions={<CreateLeadCategoryButton onCreated={() => void reload()} />}
      />
      <FormAlerts error={error} />
      <DataTable columns={columns} items={items} rowKey={(item) => item.id} loading={loading} emptyText="Категорій ще немає" />
    </>
  );
}
