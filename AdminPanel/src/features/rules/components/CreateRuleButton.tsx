'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { Select } from '@/components/ui/Select';
import { rulesApi } from '../api';
import { ACCENT_OPTIONS } from '../types';

type CreateRuleButtonProps = {
  variant?: 'primary' | 'outline';
  /** Runs instead of opening the freshly created rule. */
  onCreated?: () => void;
} & CreateModalControl;

export function CreateRuleButton({ variant, onCreated, hideTrigger, open, onOpenChange }: CreateRuleButtonProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accent, setAccent] = useState('1');

  function reset() {
    setTitle('');
    setDescription('');
    setAccent('1');
  }

  async function onCreate() {
    const created = await rulesApi.create({ title, description, accent: Number(accent) });
    reset();
    if (onCreated) {
      onCreated();
    } else {
      router.push(`/rules/${created.id}`);
    }
  }

  return (
    <CreateButton
      label="Нове правило"
      modalTitle="Нове правило"
      variant={variant}
      onCreate={onCreate}
      onOpen={reset}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label htmlFor="new-rule-title">Заголовок</label>
      <input
        id="new-rule-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={2}
        maxLength={180}
      />
      <label htmlFor="new-rule-description">Текст</label>
      <textarea
        id="new-rule-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        minLength={2}
        maxLength={320}
        rows={4}
      />
      <label htmlFor="new-rule-accent">Колір номера</label>
      <Select id="new-rule-accent" value={accent} onChange={setAccent} options={ACCENT_OPTIONS} />
    </CreateButton>
  );
}
