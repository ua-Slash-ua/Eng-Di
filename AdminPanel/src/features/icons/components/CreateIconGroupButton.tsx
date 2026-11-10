'use client';

import { useState } from 'react';
import { CreateButton } from '@/components/ui/CreateButton';
import { Select } from '@/components/ui/Select';
import { iconGroupsApi } from '../api';
import { MEDIA_TYPE_OPTIONS, type MediaType } from '../types';

type CreateIconGroupButtonProps = {
  variant?: 'primary' | 'outline';
  defaultType?: MediaType;
  onCreated?: () => void;
};

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

export function CreateIconGroupButton({
  variant,
  defaultType = 'svg',
  onCreated,
}: CreateIconGroupButtonProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<string>(defaultType);
  const [slugTouched, setSlugTouched] = useState(false);

  function reset() {
    setTitle('');
    setSlug('');
    setType(defaultType);
    setSlugTouched(false);
  }

  async function onCreate() {
    await iconGroupsApi.create({ title, slug, type });
    reset();
    onCreated?.();
  }

  return (
    <CreateButton label="Нова група" modalTitle="Нова група" variant={variant} onCreate={onCreate} onOpen={reset}>
      <label htmlFor="new-icon-group-type">Категорія</label>
      <Select id="new-icon-group-type" value={type} onChange={setType} options={MEDIA_TYPE_OPTIONS} />
      <label htmlFor="new-icon-group-title">Назва</label>
      <input
        id="new-icon-group-title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (!slugTouched) {
            setSlug(slugify(e.target.value) || 'group');
          }
        }}
        required
        minLength={2}
      />
      <label htmlFor="new-icon-group-slug">Slug</label>
      <input
        id="new-icon-group-slug"
        className="mono"
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
        }}
        placeholder="content"
        required
        pattern="[a-z0-9-]+"
      />
    </CreateButton>
  );
}
