'use client';

import { RepeaterField, type RepeaterFieldDef } from '@/components/fields/RepeaterField';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { createFormatCard, FORMAT_ACCENT_OPTIONS, type FormatCardItem } from '../types';

type FormatsBlockFieldsProps = {
  description: string;
  setDescription: (value: string) => void;
  formats: FormatCardItem[];
  setFormats: (value: FormatCardItem[]) => void;
};

const FORMAT_FIELDS: RepeaterFieldDef<FormatCardItem>[] = [
  { key: 'icon', label: 'Іконка', type: 'svg-icon' },
  { key: 'title', label: 'Назва', size: 'md', maxLength: 120, placeholder: 'Розмовна практика' },
  {
    key: 'accent',
    label: 'Колір',
    type: 'select',
    size: 'sm',
    options: FORMAT_ACCENT_OPTIONS,
  },
  {
    key: 'description',
    label: 'Опис',
    type: 'textarea',
    maxLength: 320,
    placeholder: 'Знімаємо страх говорити…',
  },
];

export function FormatsBlockFields({ description, setDescription, formats, setFormats }: FormatsBlockFieldsProps) {
  return (
    <>
      <label htmlFor="formatsDescription">Опис секції</label>
      <textarea
        id="formatsDescription"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        maxLength={320}
      />
      <RepeaterField
        id="format-card"
        title="Картки форматів"
        hint="Порядок у списку = порядок на сайті. Перетягніть за ручку або скористайтесь стрілками."
        addLabel="Додати картку"
        emptyLabel="Карток ще немає — додайте першу."
        fields={FORMAT_FIELDS}
        items={formats}
        onChange={setFormats}
        createItem={createFormatCard}
        summary={(item) => (
          <>
            {item.icon ? <SvgIcon svg={item.icon} size={16} /> : null}
            {item.title}
          </>
        )}
      />
    </>
  );
}
