'use client';

import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { FormAlerts } from '@/components/ui/FormAlerts';

export type CreateModalControl = {
  /** Hide the default «+» trigger (use with RecordActionsMenu). */
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type CreateButtonProps = {
  label: string;
  modalTitle: string;
  variant?: 'primary' | 'outline';
  /**
   * Sends the create request. Throw to show the message inside the modal. Resolving with a string
   * keeps the modal open and shows it — used when the response carries something the admin must copy.
   * Pass `{ ok, warning }` to show a success note plus a mailing/other warning.
   */
  onCreate: () => Promise<void | string | { ok: string; warning?: string }>;
  /** Runs right before the modal opens so the caller can reset its fields. */
  onOpen?: () => void;
  children: ReactNode;
} & CreateModalControl;

export function CreateButton({
  label,
  modalTitle,
  variant = 'primary',
  onCreate,
  onOpen,
  children,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
}: CreateButtonProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [warning, setWarning] = useState('');
  const [busy, setBusy] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const wasOpen = useRef(false);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  function setOpen(next: boolean) {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (open && !wasOpen.current) {
      setError('');
      setOk('');
      setWarning('');
      onOpenRef.current?.();
    }
    wasOpen.current = open;
  }, [open]);

  function openModal() {
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setWarning('');
    setBusy(true);
    try {
      const note = await onCreate();
      if (typeof note === 'string') {
        setOk(note);
      } else if (note && typeof note === 'object') {
        setOk(note.ok);
        setWarning(note.warning || '');
      } else {
        setOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {hideTrigger ? null : (
        <button className={variant === 'outline' ? 'btn-outline' : 'btn'} type="button" onClick={openModal}>
          <Plus size={16} /> {label}
        </button>
      )}
      <Modal title={modalTitle} open={open} onClose={() => setOpen(false)}>
        <form className="form-box" onSubmit={onSubmit}>
          <FormAlerts error={error} ok={ok} warning={warning} />
          {children}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Створення…' : 'Створити'}
          </button>
        </form>
      </Modal>
    </>
  );
}
