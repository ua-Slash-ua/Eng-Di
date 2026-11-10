'use client';

import { ReactNode, useState, type DragEvent } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { IconPicker } from '@/components/fields/IconPicker';
import { Select } from '@/components/ui/Select';

export type RepeaterItem = Record<string, string>;

export type RepeaterFieldDef<T extends RepeaterItem> = {
  key: Extract<keyof T, string>;
  label: string;
  type?: 'text' | 'textarea' | 'image' | 'select' | 'svg-icon';
  placeholder?: string;
  maxLength?: number;
  /** Relative width inside the compact row. */
  size?: 'sm' | 'md' | 'lg';
  options?: { value: string; label: string; swatch?: string }[];
};

type RepeaterFieldProps<T extends RepeaterItem> = {
  id: string;
  title: string;
  hint?: string;
  fields: RepeaterFieldDef<T>[];
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  addLabel?: string;
  emptyLabel?: string;
  /** Short text next to the position number, e.g. `A1 · Старт`. */
  summary?: (item: T, index: number) => ReactNode;
  max?: number;
};

const SIZE_FR: Record<NonNullable<RepeaterFieldDef<RepeaterItem>['size']>, string> = {
  sm: '0.6fr',
  md: '1fr',
  lg: '1.6fr',
};

export function RepeaterField<T extends RepeaterItem>({
  id,
  title,
  hint,
  fields,
  items,
  onChange,
  createItem,
  addLabel = 'Додати',
  emptyLabel = 'Поки що порожньо — додайте перший елемент.',
  summary,
  max = 30,
}: RepeaterFieldProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  // Rows stay non-draggable until the handle is pressed, otherwise text selection inside inputs breaks.
  const [handleIndex, setHandleIndex] = useState<number | null>(null);

  const columns = fields
    .filter((field) => field.type !== 'textarea' && field.type !== 'svg-icon')
    .map((field) => SIZE_FR[field.size ?? 'md'])
    .join(' ');

  function update(index: number, key: string, value: string) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function onDrop(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();
    if (dragIndex !== null) move(dragIndex, index);
    resetDrag();
  }

  function resetDrag() {
    setDragIndex(null);
    setOverIndex(null);
    setHandleIndex(null);
  }

  return (
    <div className="repeater">
      <div className="repeater-head">
        <div>
          <span className="repeater-title">{title}</span>
          <span className="repeater-count">{items.length}</span>
          {hint ? <p className="repeater-hint">{hint}</p> : null}
        </div>
        <button type="button" className="btn-outline btn-sm" onClick={() => onChange([...items, createItem()])} disabled={items.length >= max}>
          <Plus size={15} /> {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="repeater-empty">{emptyLabel}</p>
      ) : (
        <ul className="repeater-list">
          {items.map((item, index) => (
            <li
              key={index}
              className={`repeater-item${dragIndex === index ? ' is-dragging' : ''}${overIndex === index && dragIndex !== index ? ' is-over' : ''}`}
              draggable={handleIndex === index}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => {
                event.preventDefault();
                setOverIndex(index);
              }}
              onDrop={(event) => onDrop(event, index)}
              onDragEnd={resetDrag}
            >
              <div className="repeater-bar">
                <span
                  className="repeater-grip"
                  title="Перетягніть, щоб змінити порядок"
                  onPointerDown={() => setHandleIndex(index)}
                  onPointerUp={() => setHandleIndex(null)}
                >
                  <GripVertical size={15} />
                </span>
                <span className="repeater-index">{index + 1}</span>
                {summary ? <span className="repeater-summary">{summary(item, index)}</span> : null}
                <div className="repeater-actions">
                  <button type="button" className="repeater-btn" onClick={() => move(index, index - 1)} disabled={index === 0} title="Вище">
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="repeater-btn"
                    onClick={() => move(index, index + 1)}
                    disabled={index === items.length - 1}
                    title="Нижче"
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button type="button" className="repeater-btn is-danger" onClick={() => remove(index)} title="Видалити">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="repeater-fields" style={{ gridTemplateColumns: columns || '1fr' }}>
                {fields.map((field) => {
                  const fieldId = `${id}-${index}-${field.key}`;
                  const value = item[field.key] ?? '';
                  return (
                    <div key={field.key} className={`repeater-field${field.type === 'textarea' || field.type === 'svg-icon' ? ' is-wide' : ''}`}>
                      {field.type === 'svg-icon' ? null : <label htmlFor={fieldId}>{field.label}</label>}
                      {field.type === 'svg-icon' ? (
                        <IconPicker
                          id={fieldId}
                          label={field.label}
                          value={value}
                          onChange={(next) => update(index, field.key, next)}
                        />
                      ) : field.type === 'textarea' ? (
                        <textarea
                          id={fieldId}
                          value={value}
                          rows={2}
                          maxLength={field.maxLength}
                          placeholder={field.placeholder}
                          onChange={(event) => update(index, field.key, event.target.value)}
                        />
                      ) : field.type === 'select' ? (
                        <Select
                          id={fieldId}
                          value={value}
                          onChange={(next) => update(index, field.key, next)}
                          options={field.options ?? []}
                        />
                      ) : (
                        <div className={field.type === 'image' ? 'repeater-image' : undefined}>
                          {field.type === 'image' && value ? <img src={value} alt="" /> : null}
                          <input
                            id={fieldId}
                            value={value}
                            maxLength={field.maxLength}
                            placeholder={field.placeholder}
                            onChange={(event) => update(index, field.key, event.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
