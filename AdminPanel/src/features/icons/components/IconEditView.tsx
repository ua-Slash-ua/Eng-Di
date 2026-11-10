'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SvgIconField } from '@/components/fields/SvgIconField';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel, withCopySlug } from '@/lib/duplicate';
import { ICONS } from '@/lib/svgIcon';
import { iconGroupsApi, iconsApi } from '../api';
import type { IconGroupItem, IconItem } from '../types';
import { CreateIconButton } from './CreateIconButton';

export function IconEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [item, setItem] = useState<IconItem | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [svg, setSvg] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<IconGroupItem[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { dirty, markSaved } = useDirtyForm({ name, slug, svg, groupId }, Boolean(item));

  useEffect(() => {
    iconGroupsApi
      .list('svg')
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    iconsApi
      .get(id)
      .then((icon) => {
        setItem(icon);
        setName(icon.name);
        setSlug(icon.slug);
        setSvg(icon.svg ?? '');
        setGroupId(icon.groupId != null ? String(icon.groupId) : '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const icon = await iconsApi.update(id, {
        name,
        slug,
        svg,
        groupId: groupId ? Number(groupId) : null,
      });
      setItem(icon);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!item || !confirm(`Видалити іконку «${item.name}»?`)) return;
    setRemoving(true);
    setError('');
    try {
      await iconsApi.remove(item.id);
      router.replace('/icons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    } finally {
      setRemoving(false);
    }
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const created = await iconsApi.create({
        name: withCopyLabel(name, 120),
        slug: withCopySlug(slug),
        svg,
        type: 'svg',
        groupId: groupId ? Number(groupId) : null,
      });
      router.push(`/icons/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/icons" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHead
        sticky
        backHref="/icons"
        backLabel="До іконок"
        title={item.name}
        description={
          <MetaBar
            items={[
              { label: 'Slug', value: item.slug },
              { label: 'Оновлено', value: formatDateTime(item.updatedAt) },
            ]}
          />
        }
        actions={
          <>
            <CreateIconButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            <button className="btn" type="submit" form="icon-form" disabled={busy || !dirty}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <RecordActionsMenu
              createLabel="Нова іконка"
              onCreate={() => setCreateOpen(true)}
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
          <h3>Іконка</h3>
        </div>
        <form className="form-box" id="icon-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
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
          <label htmlFor="svg">SVG</label>
          <SvgIconField id="svg" value={svg} onChange={setSvg} placeholder={ICONS.book} />
        </form>
      </div>
    </>
  );
}
