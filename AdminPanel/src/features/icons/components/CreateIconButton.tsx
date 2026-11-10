'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SvgIconField } from '@/components/fields/SvgIconField';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { Select } from '@/components/ui/Select';
import { ICONS } from '@/lib/svgIcon';
import { iconGroupsApi, iconsApi } from '../api';
import type { IconGroupItem } from '../types';

type CreateIconButtonProps = {
  variant?: 'primary' | 'outline';
  onCreated?: () => void;
} & CreateModalControl;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ\s-]/gi, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

export function CreateIconButton({ variant, onCreated, hideTrigger, open, onOpenChange }: CreateIconButtonProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [svg, setSvg] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<IconGroupItem[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);

  function reset() {
    setName('');
    setSlug('');
    setSvg('');
    setGroupId('');
    setSlugTouched(false);
  }

  useEffect(() => {
    iconGroupsApi
      .list('svg')
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  async function onCreate() {
    const created = await iconsApi.create({
      name,
      slug,
      svg,
      type: 'svg',
      groupId: groupId ? Number(groupId) : null,
    });
    reset();
    if (onCreated) {
      onCreated();
    } else {
      router.push(`/icons/${created.id}`);
    }
  }

  return (
    <CreateButton
      label="Нова іконка"
      modalTitle="Нова іконка"
      variant={variant}
      onCreate={onCreate}
      onOpen={reset}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label htmlFor="new-icon-name">Назва</label>
      <input
        id="new-icon-name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slugTouched) {
            setSlug(slugify(e.target.value) || 'icon');
          }
        }}
        required
        minLength={2}
        maxLength={120}
        placeholder="Книга"
      />
      <label htmlFor="new-icon-slug">Slug</label>
      <input
        id="new-icon-slug"
        className="mono"
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
        }}
        required
        pattern="[a-z0-9-]+"
        maxLength={120}
        placeholder="book"
      />
      <label htmlFor="new-icon-group">Група</label>
      <Select
        id="new-icon-group"
        value={groupId}
        onChange={setGroupId}
        placeholder="Без групи"
        options={[
          { value: '', label: 'Без групи' },
          ...groups.map((group) => ({ value: String(group.id), label: group.title })),
        ]}
      />
      <label htmlFor="new-icon-svg">SVG</label>
      <SvgIconField id="new-icon-svg" value={svg} onChange={setSvg} placeholder={ICONS.book} />
    </CreateButton>
  );
}
