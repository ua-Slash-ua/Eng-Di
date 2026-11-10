'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IconPicker } from '@/components/fields/IconPicker';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel } from '@/lib/duplicate';
import { formatsApi } from '../api';
import { ACCENT_OPTIONS, type FormatItem } from '../types';
import { CreateFormatButton } from './CreateFormatButton';

export function FormatEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [item, setItem] = useState<FormatItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [accent, setAccent] = useState('1');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { dirty, markSaved } = useDirtyForm({ title, description, icon, accent }, Boolean(item));

  useEffect(() => {
    formatsApi
      .get(id)
      .then((format) => {
        setItem(format);
        setTitle(format.title);
        setDescription(format.description);
        setIcon(format.icon ?? '');
        setAccent(String(format.accent));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const format = await formatsApi.update(id, {
        title,
        description,
        icon,
        accent: Number(accent),
      });
      setItem(format);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    if (!window.confirm(`Видалити «${item.title}»?`)) return;
    setError('');
    try {
      await formatsApi.remove(item.id);
      router.replace('/formats');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const created = await formatsApi.create({
        title: withCopyLabel(title, 120),
        description,
        icon,
        accent: Number(accent),
      });
      router.push(`/formats/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/formats" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHead
        sticky
        backHref="/formats"
        backLabel="До форматів"
        title={item.title}
        description={
          <MetaBar
            items={[
              { label: 'Оновлено', value: formatDateTime(item.updatedAt) },
              { label: 'Створено', value: formatDateTime(item.createdAt) },
            ]}
          />
        }
        actions={
          <>
            <CreateFormatButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            <button className="btn" type="submit" form="format-form" disabled={busy || !dirty}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <RecordActionsMenu
              createLabel="Новий формат"
              onCreate={() => setCreateOpen(true)}
              onDuplicate={() => void onDuplicate()}
              duplicateBusy={duplicating}
              onDelete={onDelete}
            />
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Формат</h3>
        </div>
        <form className="form-box" id="format-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <label htmlFor="title">Назва</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={120} />
          <label htmlFor="description">Опис</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={2}
            maxLength={320}
            rows={4}
          />
          <IconPicker id="icon" value={icon} onChange={setIcon} />
          <label htmlFor="accent">Колір іконки</label>
          <Select id="accent" value={accent} onChange={setAccent} options={ACCENT_OPTIONS} />
        </form>
      </div>
    </>
  );
}
