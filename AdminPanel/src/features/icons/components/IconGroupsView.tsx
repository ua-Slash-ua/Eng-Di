'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { iconGroupsApi } from '../api';
import { MEDIA_TYPE_LABELS, MEDIA_TYPE_OPTIONS, type IconGroupItem, type MediaType } from '../types';
import { CreateIconGroupButton } from './CreateIconGroupButton';

export function IconGroupsView() {
  const [type, setType] = useState<MediaType>('svg');
  const [items, setItems] = useState<IconGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await iconGroupsApi.list(type));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  const onDelete = useCallback(
    async (id: number) => {
      setError('');
      try {
        await iconGroupsApi.remove(id);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не вдалося видалити');
      }
    },
    [reload],
  );

  const columns = useMemo<Column<IconGroupItem>[]>(
    () => [
      {
        key: 'title',
        header: 'Назва',
        render: (item) => <span className="student-name">{item.title}</span>,
      },
      {
        key: 'slug',
        header: 'Slug',
        width: '15.2778vw',
        render: (item) => <span className="mono">{item.slug}</span>,
      },
      {
        key: 'count',
        header: 'Записів',
        width: '8.3333vw',
        render: (item) => item._count?.icons ?? 0,
      },
      {
        key: 'actions',
        header: '',
        width: '11.1111vw',
        render: (item) => (
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
        backHref={type === 'image' ? '/images' : type === 'video' ? '/videos' : '/icons'}
        backLabel={type === 'image' ? 'До зображень' : type === 'video' ? 'До відео' : 'До іконок'}
        title="Групи медіа"
        description={`Окремі групи для категорії «${MEDIA_TYPE_LABELS[type]}». SVG, зображення й відео не змішуються.`}
        actions={<CreateIconGroupButton defaultType={type} onCreated={() => void reload()} />}
      />
      <div className="media-type-tabs" role="tablist" aria-label="Категорія груп">
        {MEDIA_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={type === option.value}
            className={`media-type-tab${type === option.value ? ' is-active' : ''}`}
            onClick={() => setType(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <FormAlerts error={error} />
      <DataTable
        columns={columns}
        items={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyText={`Груп для «${MEDIA_TYPE_LABELS[type]}» ще немає`}
      />
    </>
  );
}
