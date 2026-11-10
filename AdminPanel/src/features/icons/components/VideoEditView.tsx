'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel, withCopySlug } from '@/lib/duplicate';
import { formatBytes } from '@/lib/format';
import { iconGroupsApi, iconsApi } from '../api';
import type { IconGroupItem, IconItem } from '../types';

export function VideoEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [item, setItem] = useState<IconItem | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [alt, setAlt] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<IconGroupItem[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { dirty, markSaved } = useDirtyForm({ name, slug, alt, groupId }, Boolean(item));

  useEffect(() => {
    iconGroupsApi
      .list('video')
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    iconsApi
      .get(id)
      .then((video) => {
        setItem(video);
        setName(video.name);
        setSlug(video.slug);
        setAlt(video.alt ?? '');
        setGroupId(video.groupId != null ? String(video.groupId) : '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const video = await iconsApi.update(id, {
        name,
        slug,
        alt,
        groupId: groupId ? Number(groupId) : null,
      });
      setItem(video);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!item || !confirm(`Видалити відео «${item.name}»?`)) return;
    setRemoving(true);
    setError('');
    try {
      await iconsApi.remove(item.id);
      router.replace('/videos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    } finally {
      setRemoving(false);
    }
  }

  async function onDuplicate() {
    if (!item) return;
    setDuplicating(true);
    setError('');
    try {
      const created = await iconsApi.create({
        name: withCopyLabel(name, 120),
        slug: withCopySlug(slug),
        url: item.url ?? undefined,
        alt,
        type: 'video',
        groupId: groupId ? Number(groupId) : null,
      });
      router.push(`/videos/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/videos" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHead
        sticky
        backHref="/videos"
        backLabel="До відео"
        title={item.name}
        description={
          <MetaBar
            items={[
              { label: 'Slug', value: item.slug },
              { label: 'Розмір', value: formatBytes(item.sizeBytes) },
              { label: 'Оновлено', value: formatDateTime(item.updatedAt) },
            ]}
          />
        }
        actions={
          <>
            <button className="btn" type="submit" form="video-form" disabled={busy || !dirty}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <RecordActionsMenu
              onDuplicate={() => void onDuplicate()}
              duplicateBusy={duplicating}
              onDelete={() => void onDelete()}
              deleteDisabled={removing}
            />
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Відео</h3>
        </div>
        <form className="form-box" id="video-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          {item.url ? <video src={item.url} className="media-preview" controls playsInline /> : null}
          <label htmlFor="name">Назва</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} />
          <label htmlFor="slug">Slug</label>
          <input
            id="slug"
            className="mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            required
            pattern="[a-z0-9-]+"
            maxLength={120}
          />
          <label htmlFor="alt">Опис / Alt</label>
          <input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={255} />
          <label htmlFor="groupId">Група</label>
          <Select
            id="groupId"
            value={groupId}
            onChange={setGroupId}
            placeholder="Без групи"
            options={[
              { value: '', label: 'Без групи' },
              ...groups.map((group) => ({ value: String(group.id), label: group.title })),
            ]}
          />
        </form>
      </div>
    </>
  );
}
