'use client';

import { RepeaterField, type RepeaterFieldDef } from '@/components/fields/RepeaterField';
import { createLevel, type LevelItem } from '../types';

type LevelsBlockFieldsProps = {
  description: string;
  setDescription: (value: string) => void;
  levels: LevelItem[];
  setLevels: (value: LevelItem[]) => void;
};

const LEVEL_FIELDS: RepeaterFieldDef<LevelItem>[] = [
  { key: 'code', label: 'Позначення', size: 'sm', maxLength: 12, placeholder: 'A1' },
  { key: 'title', label: 'Назва', size: 'md', maxLength: 80, placeholder: 'Старт' },
  { key: 'description', label: 'Підпис', size: 'lg', maxLength: 160, placeholder: 'Прості фрази й побут' },
];

export function LevelsBlockFields({ description, setDescription, levels, setLevels }: LevelsBlockFieldsProps) {
  return (
    <>
      <label htmlFor="levelsDescription">Опис секції</label>
      <textarea
        id="levelsDescription"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        maxLength={320}
      />
      <RepeaterField
        id="level"
        title="Рівні"
        hint="Порядок у списку = порядок на сайті. Перетягніть за ручку або скористайтесь стрілками."
        addLabel="Додати рівень"
        emptyLabel="Рівнів ще немає — додайте перший."
        fields={LEVEL_FIELDS}
        items={levels}
        onChange={setLevels}
        createItem={createLevel}
        summary={(item) => [item.code, item.title].filter(Boolean).join(' · ')}
      />
    </>
  );
}
