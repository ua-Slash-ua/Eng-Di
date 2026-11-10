'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { Select } from '@/components/ui/Select';
import { blocksApi } from '../api';
import { asBlockType, BLOCK_TYPE_OPTIONS, type BlockType } from '../types';

type CreateBlockButtonProps = {
  variant?: 'primary' | 'outline';
  /** Runs instead of opening the freshly created block. */
  onCreated?: () => void;
} & CreateModalControl;

export function CreateBlockButton({ variant, onCreated, hideTrigger, open, onOpenChange }: CreateBlockButtonProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<BlockType>('hero');

  async function onCreate() {
    const created = await blocksApi.create({ name, type });
    setName('');
    if (onCreated) {
      onCreated();
    } else {
      router.push(`/blocks/${created.id}`);
    }
  }

  return (
    <CreateButton
      label="Новий блок"
      modalTitle="Новий блок"
      variant={variant}
      onCreate={onCreate}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
      onOpen={() => {
        setName('');
        setType('hero');
      }}
    >
      <label htmlFor="new-block-name">Назва в адмінці</label>
      <input
        id="new-block-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        maxLength={180}
        placeholder={
          type === 'about'
            ? 'Про школу — головна'
            : type === 'levels'
              ? 'Прогрес — головна'
              : type === 'formats'
                ? 'Формати — головна'
                : type === 'pricing'
                  ? 'Пакети — головна'
                  : type === 'rules'
                    ? 'Правила — головна'
                    : type === 'reviews'
                      ? 'Відгуки — головна'
                      : type === 'cta'
                        ? 'CTA — головна'
                        : type === 'lead'
                          ? 'Заявка — головна'
                          : 'Герой головної'
        }
      />
      <label htmlFor="new-block-type">Тип блоку</label>
      <Select id="new-block-type" value={type} onChange={(value) => setType(asBlockType(value))} options={BLOCK_TYPE_OPTIONS} />
    </CreateButton>
  );
}
