'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/Modal';

export type UsageItem = {
  id: number;
  label: string;
  hint?: string;
  href?: string;
};

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: ReactNode;
  usage?: UsageItem[];
  usageLoading?: boolean;
  usageTitle?: string;
  usageEmpty?: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  usage,
  usageLoading = false,
  usageTitle = 'Де використовується',
  usageEmpty = 'Ніде не використовується.',
  confirmLabel = 'Видалити',
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} open={open} onClose={onClose}>
      <div className="form-box">
        <div className="confirm-lead">
          <span className="confirm-icon">
            <AlertTriangle size={18} />
          </span>
          <p>{message}</p>
        </div>

        {usage ? (
          <div className="confirm-usage">
            <div className="confirm-usage-head">{usageTitle}</div>
            {usageLoading ? <p className="ms-empty">Перевіряємо…</p> : null}
            {!usageLoading && usage.length === 0 ? <p className="ms-empty">{usageEmpty}</p> : null}
            {!usageLoading &&
              usage.map((entry) =>
                entry.href ? (
                  <Link className="usage-row" href={entry.href} key={entry.id}>
                    <b>{entry.label}</b>
                    {entry.hint ? <span>{entry.hint}</span> : null}
                  </Link>
                ) : (
                  <div className="usage-row" key={entry.id}>
                    <b>{entry.label}</b>
                    {entry.hint ? <span>{entry.hint}</span> : null}
                  </div>
                ),
              )}
          </div>
        ) : null}

        <div className="confirm-actions">
          <button className="btn-outline" type="button" onClick={onClose}>
            Скасувати
          </button>
          <button className="btn-danger" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Видалення…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
