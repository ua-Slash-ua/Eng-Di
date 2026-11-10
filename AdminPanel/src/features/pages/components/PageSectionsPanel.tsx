'use client';

import { useMemo, useState, type DragEvent } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { BLOCK_TYPE_LABELS } from '@/features/blocks/types';
import type { BlockCatalogItem, PageSection } from '../types';

type PageSectionsPanelProps = {
  sections: PageSection[];
  catalog: BlockCatalogItem[];
  busy: boolean;
  onAttach: (blockId: number) => Promise<void>;
  onReorder: (sectionIds: number[]) => Promise<void>;
  onDetach: (sectionId: number) => Promise<void>;
};

export function PageSectionsPanel({
  sections,
  catalog,
  busy,
  onAttach,
  onReorder,
  onDetach,
}: PageSectionsPanelProps) {
  const [pickId, setPickId] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [handleIndex, setHandleIndex] = useState<number | null>(null);

  const attachedIds = useMemo(() => new Set(sections.map((item) => item.block.id)), [sections]);
  const available = catalog.filter((item) => !attachedIds.has(item.id));
  const options = [
    { value: '', label: available.length ? 'Обрати блок…' : 'Немає вільних блоків' },
    ...available.map((item) => ({
      value: String(item.id),
      label: `${item.name} · ${BLOCK_TYPE_LABELS[item.type] || item.type}`,
    })),
  ];

  async function move(from: number, to: number) {
    if (to < 0 || to >= sections.length || from === to) return;
    const next = sections.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    await onReorder(next.map((item) => item.id));
  }

  function onDrop(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();
    if (dragIndex !== null) void move(dragIndex, index);
    resetDrag();
  }

  function resetDrag() {
    setDragIndex(null);
    setOverIndex(null);
    setHandleIndex(null);
  }

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <div className="panel-head">
        <h3>Блоки на сторінці</h3>
      </div>
      <div className="form-box">
        <p className="muted">Додавайте вже створені блоки з бібліотеки та змінюйте їхній порядок на сторінці.</p>

        <div className="page-sections-add">
          <Select id="attach-block" value={pickId} onChange={setPickId} options={options} disabled={!available.length || busy} />
          <button
            type="button"
            className="btn"
            disabled={!pickId || busy}
            onClick={() => {
              const blockId = Number(pickId);
              if (!blockId) return;
              void onAttach(blockId).then(() => setPickId(''));
            }}
          >
            <Plus size={16} /> Додати
          </button>
        </div>

        {sections.length === 0 ? (
          <p className="repeater-empty">Поки немає блоків — додайте перший з бібліотеки.</p>
        ) : (
          <ul className="repeater-list">
            {sections.map((section, index) => (
              <li
                key={section.id}
                className={`repeater-item${dragIndex === index ? ' is-dragging' : ''}${
                  overIndex === index && dragIndex !== index ? ' is-over' : ''
                }`}
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
                  <span className="repeater-summary">
                    {section.block.name}
                    <span className="muted"> · {BLOCK_TYPE_LABELS[section.block.type] || section.block.type}</span>
                  </span>
                  <div className="repeater-actions">
                    <button
                      type="button"
                      className="repeater-btn"
                      disabled={busy || index === 0}
                      onClick={() => void move(index, index - 1)}
                      title="Вище"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="repeater-btn"
                      disabled={busy || index === sections.length - 1}
                      onClick={() => void move(index, index + 1)}
                      title="Нижче"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <Link className="repeater-btn" href={`/blocks/${section.block.id}`} title="Редагувати блок">
                      <Pencil size={15} />
                    </Link>
                    <button
                      type="button"
                      className="repeater-btn is-danger"
                      disabled={busy}
                      onClick={() => void onDetach(section.id)}
                      title="Прибрати зі сторінки"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
