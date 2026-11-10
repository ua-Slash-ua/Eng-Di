'use client';

import { Modal } from '@/components/Modal';
import { FormAlerts } from '@/components/ui/FormAlerts';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Видалити',
  cancelLabel = 'Скасувати',
  busy = false,
  busyLabel = 'Видалення…',
  error = '',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal title={title} open={open} onClose={busy ? () => undefined : onClose}>
      <div className="form-box">
        <FormAlerts error={error} />
        <p className="muted" style={{ margin: '0 0 1.1111vw' }}>
          {description}
        </p>
        <div className="head-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="btn-outline" type="button" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </button>
          <button className="btn-danger" type="button" disabled={busy} onClick={onConfirm}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
