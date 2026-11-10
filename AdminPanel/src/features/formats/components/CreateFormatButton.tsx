'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPicker } from '@/components/fields/IconPicker';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { Select } from '@/components/ui/Select';
import { formatsApi } from '../api';
import { ACCENT_OPTIONS } from '../types';

type CreateFormatButtonProps = {
  variant?: 'primary' | 'outline';
  /** Runs instead of opening the freshly created format. */
  onCreated?: () => void;
} & CreateModalControl;

export function CreateFormatButton({ variant, onCreated, hideTrigger, open, onOpenChange }: CreateFormatButtonProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [accent, setAccent] = useState('1');

  function reset() {
    setTitle('');
    setDescription('');
    setIcon('');
    setAccent('1');
  }

  async function onCreate() {
    const created = await formatsApi.create({
      title,
      description,
      icon: icon.trim() || undefined,
      accent: Number(accent),
    });
    reset();
    if (onCreated) {
      onCreated();
    } else {
      router.push(`/formats/${created.id}`);
    }
  }

  return (
    <CreateButton
      label="Новий формат"
      modalTitle="Новий формат"
      variant={variant}
      onCreate={onCreate}
      onOpen={reset}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label htmlFor="new-format-title">Назва</label>
      <input
        id="new-format-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={2}
        maxLength={120}
      />
      <label htmlFor="new-format-description">Опис</label>
      <textarea
        id="new-format-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        minLength={2}
        maxLength={320}
        rows={4}
      />
      <IconPicker id="new-format-icon" value={icon} onChange={setIcon} />
      <label htmlFor="new-format-accent">Колір іконки</label>
      <Select id="new-format-accent" value={accent} onChange={setAccent} options={ACCENT_OPTIONS} />
    </CreateButton>
  );
}
