'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ScheduleLessonMark } from './api';

export type LessonMenuAction =
  | 'open'
  | 'student'
  | 'accept'
  | 'decline'
  | 'propose'
  | 'complete'
  | 'miss'
  | 'freeze';

export function LessonContextMenu({
  lesson,
  x,
  y,
  items,
  busy,
  locked = false,
  onPick,
  onClose,
}: {
  lesson: ScheduleLessonMark;
  x: number;
  y: number;
  items: { id: LessonMenuAction; label: string }[];
  busy: boolean;
  locked?: boolean;
  onPick: (id: LessonMenuAction) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - rect.width - 8);
    if (top + rect.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - rect.height - 8);
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
  }, [x, y, items.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    function onDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    function onScroll() {
      if (locked) return;
      onClose();
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose, locked]);

  return (
    <div
      ref={ref}
      className={`lesson-ctx${locked ? ' is-locked' : ''}`}
      role="menu"
      style={{ left: x, top: y }}
    >
      <p className="lesson-ctx-head">
        Урок {lesson.number}
        {lesson.with ? ` · ${lesson.with}` : ''}
      </p>
      {items.map((item) => (
        <button key={item.id} type="button" role="menuitem" disabled={busy} onClick={() => onPick(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
