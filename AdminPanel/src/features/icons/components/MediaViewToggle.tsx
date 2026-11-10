'use client';

import { LayoutGrid, List } from 'lucide-react';
import type { MediaViewMode } from '@/hooks/useMediaViewMode';

type MediaViewToggleProps = {
  value: MediaViewMode;
  onChange: (value: MediaViewMode) => void;
};

export function MediaViewToggle({ value, onChange }: MediaViewToggleProps) {
  return (
    <div className="media-view-toggle" role="group" aria-label="Тип відображення">
      <button
        type="button"
        className={`media-view-btn${value === 'list' ? ' is-active' : ''}`}
        aria-pressed={value === 'list'}
        title="Список"
        onClick={() => onChange('list')}
      >
        <List size={16} aria-hidden="true" />
        <span>Список</span>
      </button>
      <button
        type="button"
        className={`media-view-btn${value === 'grid' ? ' is-active' : ''}`}
        aria-pressed={value === 'grid'}
        title="Сітка"
        onClick={() => onChange('grid')}
      >
        <LayoutGrid size={16} aria-hidden="true" />
        <span>Сітка</span>
      </button>
    </div>
  );
}
