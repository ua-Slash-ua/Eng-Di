'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconPicker } from '@/components/fields/IconPicker';
import { CreateButton, type CreateModalControl } from '@/components/ui/CreateButton';
import { Select } from '@/components/ui/Select';
import { ICONS } from '@/lib/svgIcon';
import { tariffsApi } from '../api';
import { VARIANT_OPTIONS } from '../types';

type CreateTariffButtonProps = {
  variant?: 'primary' | 'outline';
  /** Runs instead of opening the freshly created tariff. */
  onCreated?: () => void;
} & CreateModalControl;

export function CreateTariffButton({ variant, onCreated, hideTrigger, open, onOpenChange }: CreateTariffButtonProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [lessons, setLessons] = useState('4');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [note, setNote] = useState('');
  const [cardVariant, setCardVariant] = useState('start');
  const [icon, setIcon] = useState<string>(ICONS.book);
  const [popular, setPopular] = useState(false);
  const [frozenLessonsPerMonth, setFrozenLessonsPerMonth] = useState('0');

  function reset() {
    setTitle('');
    setLessons('4');
    setPrice('');
    setOldPrice('');
    setNote('');
    setCardVariant('start');
    setIcon(ICONS.book);
    setPopular(false);
    setFrozenLessonsPerMonth('0');
  }

  async function onCreate() {
    const created = await tariffsApi.create({
      title,
      lessons: Number(lessons),
      price: Number(price),
      ...(oldPrice ? { oldPrice: Number(oldPrice) } : {}),
      note,
      variant: cardVariant,
      icon: icon.trim() || undefined,
      popular,
      frozenLessonsPerMonth: Math.max(0, Number(frozenLessonsPerMonth) || 0),
    });
    reset();
    if (onCreated) {
      onCreated();
    } else {
      router.push(`/tariffs/${created.id}`);
    }
  }

  return (
    <CreateButton
      label="Новий тариф"
      modalTitle="Новий тариф"
      variant={variant}
      onCreate={onCreate}
      onOpen={reset}
      hideTrigger={hideTrigger}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label htmlFor="new-tariff-title">Назва</label>
      <input
        id="new-tariff-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={2}
        maxLength={120}
        placeholder="8 уроків"
      />
      <label htmlFor="new-tariff-lessons">Уроків</label>
      <input
        id="new-tariff-lessons"
        type="number"
        min={1}
        value={lessons}
        onChange={(e) => setLessons(e.target.value)}
        required
      />
      <label htmlFor="new-tariff-frozen">Заморозок на місяць</label>
      <input
        id="new-tariff-frozen"
        type="number"
        min={0}
        value={frozenLessonsPerMonth}
        onChange={(e) => setFrozenLessonsPerMonth(e.target.value)}
      />
      <label htmlFor="new-tariff-price">Ціна, грн</label>
      <input id="new-tariff-price" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required />
      <label htmlFor="new-tariff-old-price">Стара ціна, грн</label>
      <input
        id="new-tariff-old-price"
        type="number"
        min={0}
        value={oldPrice}
        onChange={(e) => setOldPrice(e.target.value)}
        placeholder="немає знижки"
      />
      <label htmlFor="new-tariff-note">Підпис унизу</label>
      <input
        id="new-tariff-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        required
        minLength={2}
        maxLength={180}
        placeholder="✨ Чудовий старт"
      />
      <label htmlFor="new-tariff-variant">Стиль картки</label>
      <Select id="new-tariff-variant" value={cardVariant} onChange={setCardVariant} options={VARIANT_OPTIONS} />
      <IconPicker id="new-tariff-icon" value={icon} onChange={setIcon} />
      <label className="form-check">
        <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} /> Популярний вибір
      </label>
    </CreateButton>
  );
}
