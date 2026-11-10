'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, Upload } from 'lucide-react';
import { iconsApi } from '@/features/icons/api';
import type { IconCatalogItem, IconItem } from '@/features/icons/types';
import { settingsApi, type MediaSettings } from '@/features/settings/api';

type ImagePickerProps = {
  id?: string;
  label?: string;
  /** Single URL mode (default) or multi URLs. */
  multiple?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
};

export function ImagePicker({
  id,
  label = 'Зображення',
  multiple = false,
  value,
  onChange,
}: ImagePickerProps) {
  const [items, setItems] = useState<IconCatalogItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [media, setMedia] = useState<MediaSettings | null>(null);
  const [imageAccept, setImageAccept] = useState('image/*');
  const [allowedMimes, setAllowedMimes] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedUrls = useMemo(() => (Array.isArray(value) ? value : value ? [value] : []), [value]);

  function reload() {
    setLoading(true);
    iconsApi
      .catalog({ type: 'image' })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    settingsApi
      .getMedia()
      .then((payload) => {
        setMedia(payload.settings);
        setImageAccept(payload.imageAccept || 'image/*');
        const selected = new Set(payload.settings.imageFormats);
        setAllowedMimes(
          new Set(
            payload.imageFormatOptions
              .filter((option) => selected.has(option.id))
              .flatMap((option) => option.mimes),
          ),
        );
      })
      .catch(() => {
        setMedia(null);
        setImageAccept('image/*');
        setAllowedMimes(new Set());
      });
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.slug.toLowerCase().includes(needle) ||
        (item.alt || '').toLowerCase().includes(needle) ||
        item.group?.title.toLowerCase().includes(needle),
    );
  }, [items, query]);

  function toggle(url: string) {
    if (!url) return;
    if (!multiple) {
      onChange(url);
      return;
    }
    if (selectedUrls.includes(url)) {
      onChange(selectedUrls.filter((item) => item !== url));
    } else {
      onChange([...selectedUrls, url]);
    }
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    setUploading(true);
    try {
      const maxBytes = media ? media.maxImageMb * 1024 * 1024 : Infinity;
      const list = Array.from(files).filter((file) => {
        const mimeOk = allowedMimes.size ? allowedMimes.has(file.type) : file.type.startsWith('image/');
        return mimeOk && file.size <= maxBytes;
      });
      if (!list.length) {
        throw new Error(
          media
            ? `Немає валідних файлів (формати: ${media.imageFormats.map((id) => id.toUpperCase()).join(', ')}, до ${media.maxImageMb} МБ)`
            : 'Оберіть зображення',
        );
      }
      const created = await iconsApi.upload(
        list,
        list.map((file) => {
          const name = file.name.replace(/\.[^.]+$/, '');
          return { name, alt: name };
        }),
      );
      reload();
      const urls = created.map((item: IconItem) => item.url).filter(Boolean) as string[];
      if (!urls.length) return;
      if (multiple) {
        onChange([...selectedUrls, ...urls]);
      } else {
        onChange(urls[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити');
    } finally {
      setUploading(false);
    }
  }

  const selectedItems = items.filter((item) => item.url && selectedUrls.includes(item.url));

  return (
    <div className="icon-picker image-picker" id={id}>
      <div className="icon-picker-head">
        <span className="icon-picker-label">{label}</span>
        <div className="image-picker-actions">
          <button
            type="button"
            className="btn-outline btn-sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={14} /> {uploading ? '…' : 'Завантажити'}
          </button>
          <Link href="/images" className="btn-outline btn-sm icon-picker-lib">
            <LayoutGrid size={14} /> Бібліотека
          </Link>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={imageAccept}
        multiple={multiple}
        hidden
        onChange={(event) => {
          void onUpload(event.target.files);
          event.target.value = '';
        }}
      />

      <div className="icon-picker-selected" aria-live="polite">
        {selectedUrls.length ? (
          <div className="image-picker-selected-row">
            {selectedUrls.map((url) => {
              const match = selectedItems.find((item) => item.url === url);
              return (
                <span key={url} className="image-picker-chip">
                  <img src={url} alt={match?.alt || match?.name || ''} />
                  <span>{match?.name || 'Зображення'}</span>
                </span>
              );
            })}
          </div>
        ) : (
          <span className="muted">Не обрано — виберіть з бібліотеки або завантажте</span>
        )}
      </div>

      {media ? (
        <p className="muted image-picker-limits">
          Media upload: {media.imageFormats.map((id) => id.toUpperCase()).join(', ')} · до {media.maxImageMb} МБ
        </p>
      ) : null}

      {error ? <p className="error" style={{ marginTop: 0 }}>{error}</p> : null}

      <input
        className="icon-picker-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Пошук у бібліотеці…"
        aria-label="Пошук зображень"
      />

      <div className="icon-picker-strip" role="listbox" aria-label="Зображення" aria-multiselectable={multiple}>
        {loading ? <p className="muted">Завантаження…</p> : null}
        {!loading && filtered.length === 0 ? <p className="muted">У бібліотеці порожньо</p> : null}
        {filtered.map((item) => {
          if (!item.url) return null;
          const active = selectedUrls.includes(item.url);
          return (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={active}
              title={item.name}
              className={`icon-picker-tile is-image${active ? ' is-active' : ''}`}
              onClick={() => toggle(item.url!)}
            >
              <img src={item.url} alt={item.alt || item.name} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
