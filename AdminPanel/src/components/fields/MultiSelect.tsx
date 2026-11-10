'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, GripVertical, Hash, Search, X } from 'lucide-react';
import { FieldCard } from './FieldCard';

export type MultiSelectOption<Id extends string | number = number> = {
  id: Id;
  title: string;
  subtitle?: string;
  prefix?: ReactNode;
};

type MultiSelectProps<Id extends string | number> = {
  title: string;
  hint?: string;
  placeholder?: string;
  emptyText?: string;
  options: MultiSelectOption<Id>[];
  value: Id[];
  onChange: (value: Id[]) => void;
  max?: number;
  searchable?: boolean;
  icon?: ReactNode;
};

export function MultiSelect<Id extends string | number>({
  title,
  hint,
  placeholder = 'Обрати зі списку',
  emptyText = 'Нічого не знайдено',
  options,
  value,
  onChange,
  max,
  searchable = true,
  icon = <Hash size={15} />,
}: MultiSelectProps<Id>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dragId, setDragId] = useState<Id | null>(null);

  const byId = useMemo(() => new Map(options.map((item) => [item.id, item])), [options]);
  const liveValue = value.filter((id) => byId.has(id));
  const selected = liveValue
    .map((id) => byId.get(id))
    .filter((item): item is MultiSelectOption<Id> => Boolean(item));
  const atLimit = max !== undefined && liveValue.length >= max;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return options;
    }
    return options.filter((item) => {
      const hay = `${item.title} ${item.subtitle ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [options, query]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function toggle(id: Id) {
    if (liveValue.includes(id)) {
      onChange(liveValue.filter((item) => item !== id));
      return;
    }
    if (atLimit) {
      return;
    }
    onChange([...liveValue, id]);
  }

  function move(id: Id, direction: -1 | 1) {
    const index = liveValue.indexOf(id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= liveValue.length) {
      return;
    }
    const next = [...liveValue];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  function onDrop(targetId: Id) {
    if (dragId === null || dragId === targetId) {
      setDragId(null);
      return;
    }
    const from = liveValue.indexOf(dragId);
    const to = liveValue.indexOf(targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    const next = [...liveValue];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setDragId(null);
  }

  const countLabel = max ? `${selected.length} з ${max}` : `${selected.length}`;

  return (
    <FieldCard title={title} icon={icon} hint={hint}>
      <div className="ms" ref={rootRef}>
        <button
          type="button"
          className={`ms-trigger${open ? ' is-open' : ''}`}
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          <span>{selected.length ? `${countLabel} обрано` : placeholder}</span>
          <ChevronDown size={16} />
        </button>
        {open ? (
          <div className="ms-panel" role="listbox">
            {searchable ? (
              <div className="ms-search">
                <Search size={14} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Пошук…"
                  autoFocus
                />
              </div>
            ) : null}
            <div className="ms-options">
              {filtered.length === 0 ? <p className="ms-empty">{emptyText}</p> : null}
              {filtered.map((item) => {
                const on = liveValue.includes(item.id);
                const blocked = !on && atLimit;
                return (
                  <button
                    key={String(item.id)}
                    type="button"
                    role="option"
                    aria-selected={on}
                    className={`ms-option${on ? ' is-on' : ''}${blocked ? ' is-blocked' : ''}`}
                    disabled={blocked}
                    onClick={() => toggle(item.id)}
                  >
                    <span className="ms-check">{on ? <Check size={13} /> : null}</span>
                    <span className="ms-option-text">
                      {item.prefix ? <span className="ms-prefix">{item.prefix}</span> : null}
                      <b>{item.title}</b>
                      {item.subtitle ? <span className="ms-sub">{item.subtitle}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div className="ms-chosen">
          {selected.length === 0 ? <p className="ms-empty">Нічого не обрано</p> : null}
          {selected.map((item, index) => (
            <div
              key={String(item.id)}
              className={`ms-row${dragId === item.id ? ' is-drag' : ''}`}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(item.id)}
              onDragEnd={() => setDragId(null)}
            >
              <span className="ms-grip" aria-hidden>
                <GripVertical size={14} />
              </span>
              <span className="pick-num">{index + 1}</span>
              <span className="ms-option-text">
                {item.prefix ? <span className="ms-prefix">{item.prefix}</span> : null}
                <b>{item.title}</b>
                {item.subtitle ? <span>{item.subtitle}</span> : null}
              </span>
              <span className="ms-row-actions">
                <button type="button" aria-label="Вище" onClick={() => move(item.id, -1)} disabled={index === 0}>
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Нижче"
                  onClick={() => move(item.id, 1)}
                  disabled={index === selected.length - 1}
                >
                  <ChevronDown size={14} />
                </button>
                <button type="button" aria-label="Прибрати" onClick={() => toggle(item.id)}>
                  <X size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </FieldCard>
  );
}
