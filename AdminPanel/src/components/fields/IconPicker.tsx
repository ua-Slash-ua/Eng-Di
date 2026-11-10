'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { iconsApi } from '@/features/icons/api';
import type { IconCatalogItem } from '@/features/icons/types';

type IconPickerProps = {
  id?: string;
  value: string;
  onChange: (svg: string) => void;
  label?: string;
};

export function IconPicker({ id, value, onChange, label = 'Іконка' }: IconPickerProps) {
  const [items, setItems] = useState<IconCatalogItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    iconsApi
      .catalog({ type: 'svg' })
      .then((rows) => {
        if (alive) setItems(rows);
      })
      .catch(() => {
        if (alive) setItems([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const selected = useMemo(
    () => items.find((item) => item.svg === value) ?? null,
    [items, value],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.slug.toLowerCase().includes(needle) ||
        item.group?.title.toLowerCase().includes(needle),
    );
  }, [items, query]);

  return (
    <div className="icon-picker" id={id}>
      <div className="icon-picker-head">
        <span className="icon-picker-label">{label}</span>
        <Link href="/icons" className="btn-outline btn-sm icon-picker-lib">
          <LayoutGrid size={14} /> Бібліотека
        </Link>
      </div>

      <div className="icon-picker-selected" aria-live="polite">
        {selected || value ? (
          <>
            <SvgIcon svg={selected?.svg || value} size={22} />
            <span>{selected?.name || 'Власний SVG'}</span>
          </>
        ) : (
          <span className="muted">Не обрано</span>
        )}
      </div>

      <input
        className="icon-picker-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Пошук за назвою…"
        aria-label="Пошук іконок"
      />

      <div className="icon-picker-strip" role="listbox" aria-label="Іконки">
        {loading ? <p className="muted">Завантаження…</p> : null}
        {!loading && filtered.length === 0 ? <p className="muted">Нічого не знайдено</p> : null}
        {filtered.map((item) => {
          const active = item.svg === value;
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={active}
              title={item.name}
              className={`icon-picker-tile${active ? ' is-active' : ''}`}
              onClick={() => onChange(item.svg || '')}
            >
              <SvgIcon svg={item.svg} size={22} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
