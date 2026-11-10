'use client';

import { ButtonField } from '@/components/fields/ButtonField';

type CtaBlockFieldsProps = {
  description: string;
  setDescription: (value: string) => void;
  buttonLabel: string;
  buttonHref: string;
  setButtonLabel: (value: string) => void;
  setButtonHref: (value: string) => void;
};

export function CtaBlockFields({
  description,
  setDescription,
  buttonLabel,
  buttonHref,
  setButtonLabel,
  setButtonHref,
}: CtaBlockFieldsProps) {
  return (
    <>
      <p className="muted">Плашка на сайті не показується — лише заголовок, текст і кнопка.</p>
      <label htmlFor="ctaDescription">Опис</label>
      <textarea
        id="ctaDescription"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        maxLength={320}
        placeholder="Визначимо твій рівень…"
      />
      <ButtonField
        id="ctaButton"
        title="Кнопка"
        value={{ label: buttonLabel, href: buttonHref }}
        onChange={(next) => {
          setButtonLabel(next.label);
          setButtonHref(next.href);
        }}
        hrefPlaceholder="#lead-form"
      />
    </>
  );
}
