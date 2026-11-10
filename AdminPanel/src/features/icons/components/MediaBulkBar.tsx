'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { iconsApi } from '../api';

type MediaBulkBarProps = {
  count: number;
  selectedIds: number[];
  entityLabel: string;
  onCleared: () => void;
  onDeleted: () => void | Promise<void>;
};

export function MediaBulkBar({
  count,
  selectedIds,
  entityLabel,
  onCleared,
  onDeleted,
}: MediaBulkBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirmDelete() {
    if (!selectedIds.length) return;
    setBusy(true);
    setError('');
    try {
      await iconsApi.removeMany(selectedIds);
      setConfirmOpen(false);
      onCleared();
      await onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bulk-bar">
        <span className="bulk-bar-count">Обрано {count}</span>
        <div className="bulk-bar-actions">
          <button className="btn-outline" type="button" onClick={onCleared} disabled={busy || count <= 0}>
            Скасувати
          </button>
          <button
            className="btn-danger"
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={busy || count <= 0}
          >
            <Trash2 size={15} aria-hidden="true" />
            Видалити
          </button>
        </div>
        {error ? <span className="bulk-bar-error">{error}</span> : null}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Видалити обране?"
        message={
          <>
            Буде видалено <b>{count}</b> {entityLabel}. Файли з диску також зникнуть. Цю дію не можна
            скасувати.
          </>
        }
        confirmLabel={busy ? 'Видалення…' : `Видалити (${count})`}
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onClose={() => {
          if (!busy) setConfirmOpen(false);
        }}
      />
    </>
  );
}
