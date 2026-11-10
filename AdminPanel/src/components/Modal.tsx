'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Default form width; `lg` / `xl` for denser content; `preview` for media lightbox. */
  size?: 'md' | 'lg' | 'xl' | 'preview';
};

export function Modal({ title, open, onClose, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id="modal-title">{title}</h3>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Закрити">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
