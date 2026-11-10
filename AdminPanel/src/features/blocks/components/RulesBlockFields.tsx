'use client';

import { MultiSelect } from '@/components/fields/MultiSelect';
import { ACCENT_LABELS } from '@/features/rules/types';
import type { RuleOption } from '../types';

type RulesBlockFieldsProps = {
  description: string;
  setDescription: (value: string) => void;
  ruleIds: number[];
  setRuleIds: (value: number[]) => void;
  rules: RuleOption[];
};

export function RulesBlockFields({
  description,
  setDescription,
  ruleIds,
  setRuleIds,
  rules,
}: RulesBlockFieldsProps) {
  return (
    <>
      <label htmlFor="rulesDescription">Опис секції</label>
      <textarea
        id="rulesDescription"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        maxLength={320}
        placeholder="Коротко про оплату, пропуски й перенесення"
      />
      <p className="muted">Плашка й заголовок вище — як на сайті. Пункти беруться з розділу «Правила».</p>
      <MultiSelect
        title="Правила (до 8)"
        hint="Порядок вибору = порядок у списку. Якщо порожньо — візьмуться перші з каталогу."
        placeholder="Обрати правила"
        max={8}
        value={ruleIds}
        onChange={setRuleIds}
        options={rules.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: ACCENT_LABELS[item.accent] || item.description,
        }))}
      />
    </>
  );
}
