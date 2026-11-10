'use client';

import { ReactNode, type MouseEvent } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search, X } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, type SortOrder } from '@/hooks/useTableQuery';
import { ColumnFilterCell, type ColumnFilter } from './ColumnFilterCell';
import { Select } from './Select';

export type Column<T> = {
  key: string;
  header: ReactNode;
  render: (item: T, index: number) => ReactNode;
  /** Enables header sorting; sent to the API as `sort`. */
  sortKey?: string;
  /** Renders a per-column filter control under the header. */
  filter?: ColumnFilter;
  width?: string;
  /** Keep cell content on one line (dates, pills, short values). */
  nowrap?: boolean;
};

export type ColumnFilters = {
  values: Record<string, string>;
  onChange: (param: string, value: string) => void;
};

export type TableSort = {
  sort: string;
  order: SortOrder;
  onToggle: (key: string) => void;
};

export type TablePagination = {
  page: number;
  pageCount: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export type TableSearch = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export type TableSelection<T> = {
  selected: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: (ids: number[]) => void;
  getId: (item: T) => number;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  items: T[];
  rowKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyText?: string;
  search?: TableSearch;
  filters?: ReactNode;
  sort?: TableSort;
  columnFilters?: ColumnFilters;
  pagination?: TablePagination;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  selection?: TableSelection<T>;
  bulkBar?: ReactNode;
};

export function DataTable<T>({
  columns,
  items,
  rowKey,
  onRowClick,
  loading = false,
  emptyText = 'Нічого не знайдено',
  search,
  filters,
  sort,
  columnFilters,
  pagination,
  onReset,
  hasActiveFilters = false,
  selection,
  bulkBar,
}: DataTableProps<T>) {
  const hasSelection = Boolean(selection && selection.selected.size > 0);
  const hasToolbar = Boolean(search || filters || (onReset && hasActiveFilters));
  const hasColumnFilters = Boolean(columnFilters) && columns.some((column) => column.filter);
  const pageIds = selection ? items.map((item) => selection.getId(item)) : [];
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection!.selected.has(id));
  const somePageSelected = pageIds.some((id) => selection!.selected.has(id));
  const colSpan = columns.length + (selection ? 1 : 0);

  function stopRowClick(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className={`panel${selection ? ' has-row-select' : ''}${hasSelection ? ' is-selecting' : ''}`}>
      {selection ? (
        <div className={`bulk-strip${hasSelection ? ' is-open' : ''}`} aria-hidden={!hasSelection}>
          <div className="bulk-strip-inner">{bulkBar}</div>
        </div>
      ) : null}
      {hasToolbar ? (
        <div className="table-toolbar">
          {search ? (
            <div className="table-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder={search.placeholder ?? 'Пошук…'}
                aria-label={search.placeholder ?? 'Пошук'}
              />
              {search.value ? (
                <button
                  className="table-search-clear"
                  type="button"
                  aria-label="Очистити пошук"
                  onClick={() => search.onChange('')}
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          ) : null}
          {filters ? <div className="table-filters">{filters}</div> : null}
          {onReset && hasActiveFilters ? (
            <button className="table-reset" type="button" onClick={onReset}>
              Скинути
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {selection ? (
                <th className="th-check" scope="col">
                  <label className="row-check-wrap">
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
                  </label>
                </th>
              ) : null}
              {columns.map((column) => (
                <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                  {column.sortKey && sort ? (
                    <SortableHeader column={column} sort={sort} />
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
            {hasColumnFilters && columnFilters ? (
              <tr className="filter-row">
                {selection ? <th className="th-check" /> : null}
                {columns.map((column) => (
                  <th key={column.key}>
                    {column.filter ? (
                      <ColumnFilterCell
                        filter={column.filter}
                        label={typeof column.header === 'string' ? column.header : column.key}
                        value={columnFilters.values[column.filter.param] ?? ''}
                        onChange={columnFilters.onChange}
                      />
                    ) : null}
                  </th>
                ))}
              </tr>
            ) : null}
          </thead>
          <tbody>
            {items.map((item, index) => {
              const id = selection ? selection.getId(item) : null;
              const checked = id != null && selection!.selected.has(id);
              return (
                <tr
                  key={rowKey(item)}
                  className={[onRowClick ? 'click-row' : '', checked ? 'is-selected' : '']
                    .filter(Boolean)
                    .join(' ') || undefined}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {selection && id != null ? (
                    <td className="td-check" onClick={stopRowClick}>
                      <label className="row-check-wrap">
                        <input
                          type="checkbox"
                          className="row-check"
                          checked={checked}
                          onChange={() => selection.onToggle(id)}
                          aria-label="Обрати рядок"
                        />
                        <span className="row-check-ui" aria-hidden="true" />
                      </label>
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td key={column.key} className={column.nowrap ? 'td-nowrap' : undefined}>
                      {column.render(item, index)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {items.length === 0 ? (
              <tr>
                <td className="table-empty" colSpan={colSpan}>
                  {loading ? 'Завантаження…' : emptyText}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pagination ? <TablePager {...pagination} loading={loading} /> : null}
    </div>
  );
}

function SortableHeader<T>({ column, sort }: { column: Column<T>; sort: TableSort }) {
  const active = sort.sort === column.sortKey;
  return (
    <button
      className={`th-sort${active ? ' is-active' : ''}`}
      type="button"
      onClick={() => column.sortKey && sort.onToggle(column.sortKey)}
    >
      {column.header}
      {active ? (
        sort.order === 'asc' ? (
          <ArrowUp size={13} />
        ) : (
          <ArrowDown size={13} />
        )
      ) : (
        <ChevronsUpDown size={13} className="th-sort-idle" />
      )}
    </button>
  );
}

export function TablePager({
  page,
  pageCount,
  total,
  limit,
  onPageChange,
  onLimitChange,
  loading,
}: TablePagination & { loading: boolean }) {
  return (
    <div className="pager">
      <span className="muted">
        {loading ? 'Завантаження…' : `${total} записів · сторінка ${page} з ${pageCount}`}
      </span>
      <div className="pager-controls">
        <div className="per-page">
          <span>Показувати</span>
          <Select
            variant="compact"
            ariaLabel="Записів на сторінці"
            value={String(limit)}
            onChange={(next) => onLimitChange(Number(next))}
            options={PAGE_SIZE_OPTIONS.map((option) => ({ value: String(option), label: String(option) }))}
          />
        </div>
        <div className="pager-btns">
          <button
            className="icon-btn"
            type="button"
            aria-label="Попередня сторінка"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="icon-btn"
            type="button"
            aria-label="Наступна сторінка"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
