'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { pagesApi } from '../api';
import { toSlug } from '../types';

type CreatePageButtonProps = {
  variant?: 'primary' | 'outline';
} & CreateModalControl;

export function CreatePageButton({ variant, hideTrigger, open, onOpenChange }: CreatePageButtonProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  function reset() {
    setTitle('');
    setSlug('');
    setSlugTouched(false);
  }

  async function onCreate() {
    const created = await pagesApi.create({ title, slug });
    reset();
    router.push(`/pages/${created.id}`);
  }

  return (
    <CreateButton
      label="Нова сторінка"
      modalTitle="Нова сторінка"
      variant={variant}
      onCreate={onCreate}
      onOpen={reset}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label htmlFor="new-page-title">Назва</label>
      <input
        id="new-page-title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (!slugTouched) setSlug(toSlug(e.target.value));
        }}
        required
        minLength={2}
      />
      <label htmlFor="new-page-slug">Slug</label>
      <input
        id="new-page-slug"
        className="mono"
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(toSlug(e.target.value));
        }}
        placeholder="about"
        required
        pattern="[a-z0-9-]+"
      />
      <p className="muted">Лише латиниця, цифри і дефіс. Наприклад: about, pricing, rules.</p>
    </CreateButton>
  );
}
