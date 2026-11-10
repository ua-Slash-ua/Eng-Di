'use client';

import { MultiSelect } from '@/components/fields/MultiSelect';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { formatUah } from '@/lib/format';
import type { TariffOption } from '../types';

type PricingBlockFieldsProps = {
  description: string;
  setDescription: (value: string) => void;
  tariffIds: number[];
  setTariffIds: (value: number[]) => void;
  tariffs: TariffOption[];
};

export function PricingBlockFields({
  description,
  setDescription,
  tariffIds,
  setTariffIds,
  tariffs,
}: PricingBlockFieldsProps) {
  return (
    <>
      <label htmlFor="pricingDescription">Опис секції</label>
      <textarea
        id="pricingDescription"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        maxLength={320}
        placeholder="Оплата одним платежем за весь пакет…"
      />
      <p className="muted">Плашка й заголовок вище — як на сайті. Пакети беруться з розділу «Тарифи».</p>
      <MultiSelect
        title="Пакети (до 6)"
        hint="Порядок вибору = порядок карток. Якщо порожньо — візьмуться перші з каталогу."
        placeholder="Обрати пакети"
        max={6}
        value={tariffIds}
        onChange={setTariffIds}
        options={tariffs.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: `${item.lessons} уроків · ${formatUah(item.price)} грн${item.popular ? ' · популярний' : ''}`,
          prefix: item.icon ? <SvgIcon svg={item.icon} size={16} /> : undefined,
        }))}
      />
    </>
  );
}
