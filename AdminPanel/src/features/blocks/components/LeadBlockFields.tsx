'use client';

type LeadBlockFieldsProps = {
  description: string;
  setDescription: (value: string) => void;
  buttonLabel: string;
  setButtonLabel: (value: string) => void;
};

export function LeadBlockFields({
  description,
  setDescription,
  buttonLabel,
  setButtonLabel,
}: LeadBlockFieldsProps) {
  return (
    <>
      <p className="muted">Плашка й заголовок вище — як на сайті. Поля форми (імʼя, телефон, email) фіксовані.</p>
      <label htmlFor="leadDescription">Опис</label>
      <textarea
        id="leadDescription"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        maxLength={320}
        placeholder="Залиште контакти…"
      />
      <label htmlFor="leadButtonLabel">Текст кнопки</label>
      <input
        id="leadButtonLabel"
        value={buttonLabel}
        onChange={(event) => setButtonLabel(event.target.value)}
        maxLength={80}
        placeholder="Надіслати заявку"
      />
    </>
  );
}
