'use client';

import { Suspense, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { useMediaViewMode } from '@/hooks/useMediaViewMode';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { useRowSelection } from '@/hooks/useRowSelection';
import { formatBytes } from '@/lib/format';
import { iconGroupsApi, iconsApi } from '../api';
import type { IconGroupItem, IconListItem } from '../types';
import { MediaBulkBar } from './MediaBulkBar';
import { MediaGrid } from './MediaGrid';
import { MediaPreviewModal } from './MediaPreviewModal';
import { MediaViewToggle } from './MediaViewToggle';

const FILTER_PARAMS = ['name', 'slug', 'groupId'];

function VideosListView() {
  const router = useRouter();
  const [view, setView] = useMediaViewMode('videos');
  const [groups, setGroups] = useState<IconGroupItem[]>([]);
  const [preview, setPreview] = useState<IconListItem | null>(null);
  const selection = useRowSelection();
  const list = usePaginatedList<IconListItem>(
    '/videos',
    (query) =>
      iconsApi.list({
        q: query.q,
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        order: query.order,
        ...query.filters,
        type: 'video',
      }),
    FILTER_PARAMS,
  );

  useEffect(() => {
    iconGroupsApi
      .list('video')
      .then((rows) => setGroups(rows.filter((item) => item.type === 'video')))
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
      entityLabel={selection.count === 1 ? 'відео' : 'відео'}
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
        width: '5vw',
        render: (item) =>
          item.url ? (
            <button
              type="button"
              className="media-thumb-btn"
              aria-label={`Переглянути ${item.name}`}
              onClick={(event) => openPreview(item, event)}
            >
              <span className="media-thumb-icon media-thumb-video">
                <video src={item.url} muted preload="metadata" />
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
            <div className="student-email">{item.alt || item.slug}</div>
          </>
        ),
      },
      {
        key: 'size',
        header: 'Розмір',
        sortKey: 'sizeBytes',
        width: '7.6389vw',
        render: (item) => <span className="mono muted">{formatBytes(item.sizeBytes)}</span>,
      },
      {
        key: 'group',
        header: 'Група',
        width: '13.8889vw',
        filter: {
          type: 'multi',
          param: 'groupId',
          placeholder: 'Усі групи відео',
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
        title="Відео"
        description="Бібліотека відео. Завантаження з’явиться пізніше — поки можна переглядати й групувати записи."
        actions={<MediaViewToggle value={view} onChange={setView} />}
      />
      <FormAlerts error={list.error} />
      {view === 'grid' ? (
        <MediaGrid
          items={list.items}
          loading={list.loading}
          emptyText="Відео ще немає"
          selection={selectionProps}
          bulkBar={bulkBar}
          pagination={pagination}
          onOpen={(item) => router.push(`/videos/${item.id}`)}
          onPreview={(item) => setPreview(item)}
        />
      ) : (
        <DataTable
          columns={columns}
          items={list.items}
          rowKey={(item) => item.id}
          loading={list.loading}
          onRowClick={(item) => router.push(`/videos/${item.id}`)}
          emptyText="Відео ще немає"
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

export function VideosList() {
  return (
    <Suspense fallback={<p className="muted">Завантаження…</p>}>
      <VideosListView />
    </Suspense>
  );
}
