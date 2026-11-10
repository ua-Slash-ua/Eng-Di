'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { FolderUp, Plus, Trash2, Upload } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { Select } from '@/components/ui/Select';
import { settingsApi, type MediaSettings } from '@/features/settings/api';
import { formatBytes } from '@/lib/format';
import { iconGroupsApi, iconsApi } from '../api';
import type { IconGroupItem, IconItem, UploadMetaItem } from '../types';

type PendingFile = {
  key: string;
  file: File;
  name: string;
  alt: string;
  preview: string;
};

type UploadImagesButtonProps = {
  variant?: 'primary' | 'outline';
  onUploaded?: (items: IconItem[]) => void;
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function prettyLabel(filename: string) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/^images?__/i, '')
    .replace(/__/g, ' · ')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function UploadImagesButton({
  variant = 'primary',
  onUploaded,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
}: UploadImagesButtonProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<IconGroupItem[]>([]);
  const [media, setMedia] = useState<MediaSettings | null>(null);
  const [imageAccept, setImageAccept] = useState('image/*');
  const [allowedMimes, setAllowedMimes] = useState<Set<string>>(new Set());
  const filesRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);

  function setOpen(next: boolean) {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  function clearPending(list: PendingFile[]) {
    list.forEach((item) => URL.revokeObjectURL(item.preview));
  }

  function closeModal() {
    setPending((current) => {
      clearPending(current);
      return [];
    });
    setOpen(false);
  }

  useEffect(() => {
    if (open && !wasOpen.current) {
      setPending((current) => {
        clearPending(current);
        return [];
      });
      setGroupId('');
      setError('');
      iconGroupsApi
        .list('image')
        .then(setGroups)
        .catch(() => setGroups([]));
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
    }
    wasOpen.current = open;
  }, [open]);

  function openModal() {
    setOpen(true);
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const maxBytes = media ? media.maxImageMb * 1024 * 1024 : Infinity;
    const rejected: string[] = [];
    const next = Array.from(list)
      .filter((file) => {
        const mimeOk = allowedMimes.size ? allowedMimes.has(file.type) : file.type.startsWith('image/');
        if (!mimeOk) {
          rejected.push(`${file.name}: формат`);
          return false;
        }
        if (file.size > maxBytes) {
          rejected.push(`${file.name}: > ${media?.maxImageMb ?? '?'} МБ`);
          return false;
        }
        return true;
      })
      .map((file) => {
        const label = prettyLabel(file.name) || file.name.replace(/\.[^.]+$/, '');
        return {
          key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          name: label.slice(0, 120),
          alt: label.slice(0, 255),
          preview: URL.createObjectURL(file),
        };
      });
    if (rejected.length) {
      setError(`Пропущено: ${rejected.slice(0, 3).join('; ')}${rejected.length > 3 ? '…' : ''}`);
    } else {
      setError('');
    }
    setPending((current) => [...current, ...next]);
  }

  function updatePending(key: string, patch: Partial<Pick<PendingFile, 'name' | 'alt'>>) {
    setPending((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removePending(key: string) {
    setPending((current) => {
      const target = current.find((item) => item.key === key);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((item) => item.key !== key);
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!pending.length) {
      setError('Додайте хоча б одне зображення');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const meta: UploadMetaItem[] = pending.map((item) => ({
        name: item.name,
        alt: item.alt,
        groupId: groupId ? Number(groupId) : null,
      }));
      const created = await iconsApi.upload(
        pending.map((item) => item.file),
        meta,
        groupId ? Number(groupId) : null,
      );
      clearPending(pending);
      setPending([]);
      setOpen(false);
      onUploaded?.(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити');
    } finally {
      setBusy(false);
    }
  }

  const countLabel = useMemo(
    () => (pending.length ? `${pending.length} файл(ів)` : 'немає файлів'),
    [pending.length],
  );

  return (
    <>
      {hideTrigger ? null : (
        <button className={variant === 'outline' ? 'btn-outline' : 'btn'} type="button" onClick={openModal}>
          <Plus size={16} /> Завантажити
        </button>
      )}
      <Modal title="Завантаження зображень" open={open} onClose={closeModal} size="xl">
        <form className="form-box" onSubmit={onSubmit}>
          <FormAlerts error={error} />
          {media ? (
            <p className="muted upload-limits-hint">
              Дозволено: {media.imageFormats.map((id) => id.toUpperCase()).join(', ')} · до {media.maxImageMb}{' '}
              МБ
            </p>
          ) : null}

          <div className="upload-toolbar">
            <div className="upload-actions">
              <button className="btn-outline btn-sm" type="button" onClick={() => filesRef.current?.click()}>
                <Upload size={14} /> Файли
              </button>
              <button className="btn-outline btn-sm" type="button" onClick={() => folderRef.current?.click()}>
                <FolderUp size={14} /> Папка
              </button>
              <span className="muted">{countLabel}</span>
            </div>
            <div className="upload-group">
              <label htmlFor="upload-group">Група</label>
              <Select
                id="upload-group"
                value={groupId}
                onChange={setGroupId}
                placeholder="Без групи"
                options={[
                  { value: '', label: 'Без групи' },
                  ...groups.map((group) => ({ value: String(group.id), label: group.title })),
                ]}
              />
            </div>
          </div>

          <input
            ref={filesRef}
            type="file"
            accept={imageAccept}
            multiple
            hidden
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <input
            ref={folderRef}
            type="file"
            accept={imageAccept}
            multiple
            // @ts-expect-error non-standard folder picker attributes
            webkitdirectory=""
            directory=""
            hidden
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = '';
            }}
          />

          {pending.length ? (
            <ul className="upload-list">
              {pending.map((item) => (
                <li key={item.key} className="upload-item">
                  <img src={item.preview} alt="" className="upload-thumb" />
                  <div className="upload-fields">
                    <label className="upload-field">
                      <span>Назва</span>
                      <input
                        value={item.name}
                        onChange={(event) => updatePending(item.key, { name: event.target.value })}
                        placeholder="Назва в бібліотеці"
                        required
                        maxLength={120}
                      />
                    </label>
                    <label className="upload-field">
                      <span>Alt</span>
                      <input
                        value={item.alt}
                        onChange={(event) => updatePending(item.key, { alt: event.target.value })}
                        placeholder="Опис для доступності"
                        maxLength={255}
                      />
                    </label>
                    <div className="upload-field is-wide">
                      <span>Файл</span>
                      <div className="upload-filemeta">
                        <span className="mono" title={item.file.name}>
                          {item.file.name}
                        </span>
                        <span className="muted">{formatBytes(item.file.size)}</span>
                        <span className="muted">{item.file.type || 'image'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="upload-item-side">
                    <button
                      className="btn-outline btn-sm"
                      type="button"
                      onClick={() => removePending(item.key)}
                      title="Прибрати"
                    >
                      <Trash2 size={14} /> Прибрати
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="upload-empty">Оберіть файли або папку — можна кілька зображень одразу. Для кожного задасте назву й Alt.</p>
          )}

          <button className="btn" type="submit" disabled={busy || !pending.length}>
            {busy ? 'Завантаження…' : 'Завантажити в бібліотеку'}
          </button>
        </form>
      </Modal>
    </>
  );
}
