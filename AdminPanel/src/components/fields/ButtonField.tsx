'use client';

import { MousePointerClick } from 'lucide-react';
import { FieldCard } from './FieldCard';

export type ButtonFieldValue = {
  label: string;
  href: string;
};

type ButtonFieldProps = {
  id: string;
  title: string;
  value: ButtonFieldValue;
  onChange: (value: ButtonFieldValue) => void;
  labelPlaceholder?: string;
  hrefPlaceholder?: string;
};

export function ButtonField({
  id,
  title,
  value,
  onChange,
  labelPlaceholder = 'Текст кнопки',
  hrefPlaceholder = '#lead-form',
}: ButtonFieldProps) {
  const labelId = `${id}-label`;
  const hrefId = `${id}-href`;

  return (
    <FieldCard title={title} icon={<MousePointerClick size={15} />}>
      <div className="field-card-grid">
        <div>
          <label htmlFor={labelId}>Текст</label>
          <input
            id={labelId}
            value={value.label}
            onChange={(event) => onChange({ ...value, label: event.target.value })}
            placeholder={labelPlaceholder}
          />
        </div>
        <div>
          <label htmlFor={hrefId}>Посилання</label>
          <input
            id={hrefId}
            value={value.href}
            onChange={(event) => onChange({ ...value, href: event.target.value })}
            placeholder={hrefPlaceholder}
          />
        </div>
      </div>
    </FieldCard>
  );
}
