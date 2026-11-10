'use client';

import { SvgIcon } from '@/components/ui/SvgIcon';
import { ICON_MAX_LENGTH } from '@/lib/svgIcon';

type SvgIconFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SvgIconField({
  id,
  value,
  onChange,
  placeholder = '<svg viewBox="0 0 24 24">…</svg>',
}: SvgIconFieldProps) {
  return (
    <div className="svg-icon-field">
      <div className="svg-icon-preview" aria-hidden>
        <SvgIcon svg={value} size={28} />
      </div>
      <textarea
        id={id}
        value={value}
        rows={3}
        spellCheck={false}
        maxLength={ICON_MAX_LENGTH}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
