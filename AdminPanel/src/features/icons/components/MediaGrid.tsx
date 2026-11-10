'use client';

import { type MouseEvent, type ReactNode } from 'react';
import { Eye, Play } from 'lucide-react';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { TablePager, type TablePagination, type TableSelection } from '@/components/ui/DataTable';
import { formatBytes } from '@/lib/format';
import type { IconListItem } from '../types';

type MediaGridProps = {
  items: IconListItem[];
  loading?: boolean;
  emptyText?: string;
  selection?: TableSelection<IconListItem>;
  bulkBar?: ReactNode;
  pagination?: TablePagination;
  onOpen: (item: IconListItem) => void;
  onPreview: (item: IconListItem) => void;
};

export function MediaGrid({
  items,
  loading = false,
  emptyText = 'Нічого не знайдено',
  selection,
  bulkBar,
  pagination,
  onOpen,
  onPreview,
}: MediaGridProps) {
  const hasSelection = Boolean(selection && selection.selected.size > 0);
  const pageIds = selection ? items.map((item) => selection.getId(item)) : [];
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection!.selected.has(id));
  const somePageSelected = pageIds.some((id) => selection!.selected.has(id));

  function stopCardClick(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className={`panel has-row-select media-grid-panel${hasSelection ? ' is-selecting' : ''}`}>
      {selection ? (
        <div className={`bulk-strip${hasSelection ? ' is-open' : ''}`} aria-hidden={!hasSelection}>
          <div className="bulk-strip-inner">
            {bulkBar}
            {hasSelection ? (
              <label className="row-check-wrap media-grid-select-all">
                <input
                  type="checkbox"
                  className="row-check"
                  checked={allPageSelected}
                  ref={(node) => {
                    if (node) node.indeterminate = somePageSelected && !allPageSelected;
                  }}
                  onChange={() => selection.onToggleAll(pageIds)}
                  disabled={!pageIds.length}
                  aria-label="Обрати всі на сторінці"
                />
                <span className="row-check-ui" aria-hidden="true" />
                <span className="media-grid-select-all-label">Усі на сторінці</span>
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="media-grid-empty">{loading ? 'Завантаження…' : emptyText}</div>
      ) : (
        <div className="media-grid">
          {items.map((item) => {
            const id = selection ? selection.getId(item) : item.id;
            const checked = Boolean(selection?.selected.has(id));
            const isSvg = item.type === 'svg' || Boolean(item.svg && !item.url);
            const isVideo = item.type === 'video' || Boolean(item.mime?.startsWith('video/'));

            return (
              <article
                key={item.id}
                className={`media-grid-card${checked ? ' is-selected' : ''}`}
                onClick={() => onOpen(item)}
              >
                {selection ? (
                  <div className="media-grid-check" onClick={stopCardClick}>
                    <label className="row-check-wrap">
                      <input
                        type="checkbox"
                        className="row-check"
                        checked={checked}
                        onChange={() => selection.onToggle(id)}
                        aria-label={`Обрати ${item.name}`}
                      />
                      <span className="row-check-ui" aria-hidden="true" />
                    </label>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="media-grid-preview"
                  aria-label={`Переглянути ${item.name}`}
                  onClick={(event) => {
                    stopCardClick(event);
                    onPreview(item);
                  }}
                >
                  {isSvg && item.svg ? (
                    <span className="media-grid-svg">
                      <SvgIcon svg={item.svg} size={56} />
                    </span>
                  ) : null}
                  {!isSvg && isVideo && item.url ? (
                    <>
                      <video className="media-grid-media" src={item.url} muted preload="metadata" />
                      <span className="media-grid-play" aria-hidden="true">
                        <Play size={22} fill="currentColor" />
                      </span>
                    </>
                  ) : null}
                  {!isSvg && !isVideo && item.url ? (
                    <img className="media-grid-media" src={item.url} alt="" />
                  ) : null}
                  {!isSvg && !item.url ? <span className="muted">Немає файлу</span> : null}
                  <span className="media-grid-zoom" aria-hidden="true">
                    <Eye size={16} />
                  </span>
                </button>

                <div className="media-grid-meta">
                  <div className="media-grid-name" title={item.name}>
                    {item.name}
                  </div>
                  <div className="media-grid-sub" title={item.group?.title || item.alt || item.slug}>
                    {formatBytes(item.sizeBytes)}
                    {item.group?.title ? ` · ${item.group.title}` : ''}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pagination ? <TablePager {...pagination} loading={loading} /> : null}
    </div>
  );
}
