'use client';

import { useState } from 'react';
import { CreateButton } from '@/components/ui/CreateButton';
import { leadCategoriesApi } from '../api';

type CreateLeadCategoryButtonProps = {
  variant?: 'primary' | 'outline';
  /** Runs after a successful create, e.g. to refresh the list. */
  onCreated?: () => void;
};

export function CreateLeadCategoryButton({ variant, onCreated }: CreateLeadCategoryButtonProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  function reset() {
    setTitle('');
    setSlug('');
  }

  async function onCreate() {
    await leadCategoriesApi.create({ title, slug });
    reset();
    onCreated?.();
  }

  return (
    <CreateButton label="Нова категорія" modalTitle="Нова категорія" variant={variant} onCreate={onCreate} onOpen={reset}>
      <label htmlFor="new-cat-title">Назва</label>
      <input id="new-cat-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} />
      <label htmlFor="new-cat-slug">Slug</label>
      <input
        id="new-cat-slug"
        className="mono"
        value={slug}
        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        placeholder="trial"
        required
        pattern="[a-z0-9-]+"
      />
      <p className="muted">Форма на сайті надсилає саме slug категорії.</p>
    </CreateButton>
  );
}
