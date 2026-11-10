'use client';

import { ImagePicker } from '@/components/fields/ImagePicker';
import { MultiSelect } from '@/components/fields/MultiSelect';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { AboutStatOption } from '../types';

type AboutBlockFieldsProps = {
  accentText: string;
  setAccentText: (value: string) => void;
  body: string;
  setBody: (value: string) => void;
  photoUrl: string;
  setPhotoUrl: (value: string) => void;
  photoPlaceholder: string;
  setPhotoPlaceholder: (value: string) => void;
  statIds: number[];
  setStatIds: (value: number[]) => void;
  stats: AboutStatOption[];
};

export function AboutBlockFields({
  accentText,
  setAccentText,
  body,
  setBody,
  photoUrl,
  setPhotoUrl,
  photoPlaceholder,
  setPhotoPlaceholder,
  statIds,
  setStatIds,
  stats,
}: AboutBlockFieldsProps) {
  return (
    <>
      <label htmlFor="accentText">Акцентний рядок</label>
      <input
        id="accentText"
        value={accentText}
        onChange={(event) => setAccentText(event.target.value)}
        maxLength={180}
        placeholder="Онлайн · 7 років практики · з будь-якої точки світу"
      />
      <label htmlFor="aboutBody">Основний текст</label>
      <textarea
        id="aboutBody"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={7}
        maxLength={1400}
        placeholder="Розділяйте абзаци порожнім рядком."
      />
      <p className="muted">Порожній рядок розділяє текст на абзаци.</p>
      <ImagePicker
        id="photoUrl"
        label="Фото"
        value={photoUrl}
        onChange={(next) => setPhotoUrl(typeof next === 'string' ? next : next[0] || '')}
      />
      {photoUrl ? <img className="photo-preview" src={photoUrl} alt="" /> : null}
      <label htmlFor="photoPlaceholder">Літера-заглушка без фото</label>
      <input
        id="photoPlaceholder"
        value={photoPlaceholder}
        onChange={(event) => setPhotoPlaceholder(event.target.value)}
        maxLength={4}
        placeholder="E"
      />
      <MultiSelect
        title="Цифри (до 3 карток)"
        hint="Ці картки відображаються внизу секції."
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
