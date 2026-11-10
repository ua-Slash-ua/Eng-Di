'use client';

import { Modal } from '@/components/Modal';
import { SvgIcon } from '@/components/ui/SvgIcon';

export type MediaPreviewItem = {
  name: string;
  type: string;
  svg?: string | null;
  url?: string | null;
  alt?: string | null;
  mime?: string | null;
};

type MediaPreviewModalProps = {
  item: MediaPreviewItem | null;
  open: boolean;
  onClose: () => void;
};

export function MediaPreviewModal({ item, open, onClose }: MediaPreviewModalProps) {
  const title = item?.name ?? 'Перегляд';
  const isVideo = item?.type === 'video' || Boolean(item?.mime?.startsWith('video/'));
  const isSvg = item?.type === 'svg' || Boolean(item?.svg && !item?.url);

  return (
    <Modal title={title} open={open && Boolean(item)} onClose={onClose} size="preview">
      <div className="media-lightbox">
        {item && isSvg ? (
          <div className="media-lightbox-svg">
            <SvgIcon svg={item.svg} size={148} />
          </div>
        ) : null}
        {item && !isSvg && isVideo && item.url ? (
          <video className="media-lightbox-media" src={item.url} controls autoPlay playsInline />
        ) : null}
        {item && !isSvg && !isVideo && item.url ? (
          <img className="media-lightbox-media" src={item.url} alt={item.alt || item.name} />
        ) : null}
        {item && !isSvg && !item.url ? <p className="muted">Немає файлу для перегляду</p> : null}
        {item?.alt ? <p className="muted media-lightbox-alt">{item.alt}</p> : null}
      </div>
    </Modal>
  );
}
