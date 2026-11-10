'use client';

import { Suspense, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { useMediaViewMode } from '@/hooks/useMediaViewMode';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useRowSelection } from '@/hooks/useRowSelection';
import { iconGroupsApi, iconsApi } from '../api';
import type { IconGroupItem, IconListItem } from '../types';
import { CreateIconButton } from './CreateIconButton';
import { MediaBulkBar } from './MediaBulkBar';
import { MediaGrid } from './MediaGrid';
import { MediaPreviewModal } from './MediaPreviewModal';
import { MediaViewToggle } from './MediaViewToggle';

const FILTER_PARAMS = ['name', 'slug', 'groupId'];

function IconsListView() {
  const router = useRouter();
  const [view, setView] = useMediaViewMode('icons');
  const [groups, setGroups] = useState<IconGroupItem[]>([]);
  const [preview, setPreview] = useState<IconListItem | null>(null);
  const selection = useRowSelection();
  const list = usePaginatedList<IconListItem>(
    '/icons',
    (query) =>
      iconsApi.list({
        q: query.q,
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        order: query.order,
        ...query.filters,
        type: 'svg',
      }),
    FILTER_PARAMS,
  );

  useEffect(() => {
    iconGroupsApi
      .list('svg')
      .then((rows) => setGroups(rows.filter((item) => item.type === 'svg')))
      .catch(() => setGroups([]));
  }, []);

  function openPreview(item: IconListItem, event?: MouseEvent) {
    event?.stopPropagation();
    setPreview(item);
  }

  const selectionProps = {
    selected: selection.selected,
    onToggle: selection.toggle,
    onToggleAll: selection.toggleAll,
    getId: (item: IconListItem) => item.id,
  };

  const bulkBar = (
    <MediaBulkBar
      count={selection.count}
      selectedIds={selection.selectedIds}
      entityLabel={selection.count === 1 ? 'іконку' : 'іконок'}
      onCleared={selection.clear}
      onDeleted={() => void list.reload()}
    />
  );

  const pagination = {
    page: list.data.page,
    pageCount: list.data.pageCount,
    total: list.data.total,
    limit: list.limit,
    onPageChange: list.setPage,
    onLimitChange: list.setLimit,
  };

  const columns = useMemo<Column<IconListItem>[]>(
    () => [
      {
        key: 'preview',
        header: '',
        width: '4.4444vw',
        render: (item) =>
          item.svg ? (
            <button
              type="button"
              className="media-thumb-btn"
              aria-label={`Переглянути ${item.name}`}
              onClick={(event) => openPreview(item, event)}
            >
              <span className="media-thumb-icon">
                <SvgIcon svg={item.svg} size={28} />
              </span>
            </button>
          ) : (
            '—'
          ),
      },
      {
        key: 'name',
        header: 'Назва',
        sortKey: 'name',
        filter: { type: 'text', param: 'name', placeholder: 'Назва…' },
        render: (item) => (
          <>
            <div className="student-name">{item.name}</div>
            <div className="student-email mono">{item.slug}</div>
          </>
        ),
      },
      {
        key: 'group',
        header: 'Група',
        width: '12.5vw',
        filter: {
          type: 'multi',
          param: 'groupId',
          placeholder: 'Усі групи SVG',
          options: groups.map((group) => ({ value: String(group.id), label: group.title })),
        },
        render: (item) => item.group?.title || '—',
      },
    ],
    [groups],
  );

  return (
    <>
      <PageHead
        title="Іконки"
        description="SVG з бібліотеки медіа. Групи окремі від зображень."
        actions={
          <>
            <MediaViewToggle value={view} onChange={setView} />
            <CreateIconButton onCreated={() => void list.reload()} />
          </>
        }
      />
      <FormAlerts error={list.error} />
      {view === 'grid' ? (
        <MediaGrid
          items={list.items}
          loading={list.loading}
          emptyText="Іконок ще немає"
          selection={selectionProps}
          bulkBar={bulkBar}
          pagination={pagination}
          onOpen={(item) => router.push(`/icons/${item.id}`)}
          onPreview={(item) => setPreview(item)}
        />
      ) : (
        <DataTable
          columns={columns}
          items={list.items}
          rowKey={(item) => item.id}
          loading={list.loading}
          onRowClick={(item) => router.push(`/icons/${item.id}`)}
          emptyText="Іконок ще немає"
          sort={{ sort: list.sort, order: list.order, onToggle: list.toggleSort }}
          columnFilters={{ values: list.filters, onChange: list.setFilter }}
          onReset={list.reset}
          hasActiveFilters={list.hasActiveFilters}
          selection={selectionProps}
          bulkBar={bulkBar}
          pagination={pagination}
        />
      )}
      <MediaPreviewModal item={preview} open={Boolean(preview)} onClose={() => setPreview(null)} />
    </>
  );
}

export function IconsList() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <IconsListView />
    </Suspense>
  );
}
