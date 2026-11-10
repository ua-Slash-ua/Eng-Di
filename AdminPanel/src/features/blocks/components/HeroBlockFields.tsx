'use client';

import { ButtonField } from '@/components/fields/ButtonField';
import { ImagePicker } from '@/components/fields/ImagePicker';
import { MultiSelect } from '@/components/fields/MultiSelect';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { AboutStatOption } from '../types';

type HeroBlockFieldsProps = {
  description: string;
  setDescription: (value: string) => void;
  button1Label: string;
  button1Href: string;
  setButton1Label: (value: string) => void;
  setButton1Href: (value: string) => void;
  button2Label: string;
  button2Href: string;
  setButton2Label: (value: string) => void;
  setButton2Href: (value: string) => void;
  photoUrl: string;
  setPhotoUrl: (value: string) => void;
  overlayCircle: string;
  setOverlayCircle: (value: string) => void;
  overlayValue: string;
  setOverlayValue: (value: string) => void;
  overlayLabel: string;
  setOverlayLabel: (value: string) => void;
  statIds: number[];
  setStatIds: (value: number[]) => void;
  stats: AboutStatOption[];
};

export function HeroBlockFields(props: HeroBlockFieldsProps) {
  const {
    description,
    setDescription,
    button1Label,
    button1Href,
    setButton1Label,
    setButton1Href,
    button2Label,
    button2Href,
    setButton2Label,
    setButton2Href,
    photoUrl,
    setPhotoUrl,
    overlayCircle,
    setOverlayCircle,
    overlayValue,
    setOverlayValue,
    overlayLabel,
    setOverlayLabel,
    statIds,
    setStatIds,
    stats,
  } = props;

  return (
    <>
      <label htmlFor="description">Опис</label>
      <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      <ButtonField
        id="button1"
        title="Кнопка 1"
        value={{ label: button1Label, href: button1Href }}
        onChange={(next) => {
          setButton1Label(next.label);
          setButton1Href(next.href);
        }}
        hrefPlaceholder="#pricing"
      />
      <ButtonField
        id="button2"
        title="Кнопка 2"
        value={{ label: button2Label, href: button2Href }}
        onChange={(next) => {
          setButton2Label(next.label);
          setButton2Href(next.href);
        }}
        hrefPlaceholder="#about"
      />
      <ImagePicker
        id="photoUrl"
        label="Фото"
        value={photoUrl}
        onChange={(next) => setPhotoUrl(typeof next === 'string' ? next : next[0] || '')}
      />
      {photoUrl ? <img className="photo-preview" src={photoUrl} alt="" /> : null}
      <label htmlFor="overlayCircle">Текст у жовтому колі</label>
      <input id="overlayCircle" value={overlayCircle} onChange={(e) => setOverlayCircle(e.target.value)} maxLength={16} />
      <label htmlFor="overlayValue">Текст у білій плашці</label>
      <input id="overlayValue" value={overlayValue} onChange={(e) => setOverlayValue(e.target.value)} maxLength={16} />
      <label htmlFor="overlayLabel">Підпис білої плашки</label>
      <input id="overlayLabel" value={overlayLabel} onChange={(e) => setOverlayLabel(e.target.value)} maxLength={80} />
      <MultiSelect
        title="Цифри (до 3 карток)"
        hint="Якщо обраний запис видалять — підставимо наступні з каталогу."
        placeholder="Обрати картки"
        max={3}
        value={statIds}
        onChange={setStatIds}
        options={stats.map((stat) => ({
          id: stat.id,
          title: stat.value,
          subtitle: stat.label,
          prefix: stat.icon ? <SvgIcon svg={stat.icon} size={16} /> : undefined,
        }))}
      />
    </>
  );
}
