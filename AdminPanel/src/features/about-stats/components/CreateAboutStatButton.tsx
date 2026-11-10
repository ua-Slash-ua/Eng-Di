'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPicker } from '@/components/fields/IconPicker';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { aboutStatsApi } from '../api';

type CreateAboutStatButtonProps = {
  variant?: 'primary' | 'outline';
  /** Runs instead of opening the freshly created record. */
  onCreated?: () => void;
} & CreateModalControl;

export function CreateAboutStatButton({ variant, onCreated, hideTrigger, open, onOpenChange }: CreateAboutStatButtonProps) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('');

  function reset() {
    setValue('');
    setLabel('');
    setIcon('');
  }

  async function onCreate() {
    const created = await aboutStatsApi.create({ value, label, icon: icon.trim() || undefined });
    reset();
    if (onCreated) {
      onCreated();
    } else {
      router.push(`/about-stats/${created.id}`);
    }
  }

  return (
    <CreateButton
      label="Новий запис"
      modalTitle="Новий запис"
      variant={variant}
      onCreate={onCreate}
      onOpen={reset}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label htmlFor="new-stat-value">Значення</label>
      <input
        id="new-stat-value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        maxLength={40}
        placeholder="120+"
      />
      <label htmlFor="new-stat-label">Підпис</label>
      <input
        id="new-stat-label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
        maxLength={120}
        placeholder="учнів заговорили"
      />
      <IconPicker id="new-stat-icon" value={icon} onChange={setIcon} />
    </CreateButton>
  );
}
