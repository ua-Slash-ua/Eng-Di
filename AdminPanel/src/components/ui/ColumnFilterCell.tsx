'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { MultiSelect } from './MultiSelect';
import { Select, type SelectOption } from './Select';

export type ColumnFilter =
  | { type: 'text'; param: string; placeholder?: string }
  | { type: 'select'; param: string; options: SelectOption[]; placeholder?: string }
  | { type: 'multi'; param: string; options: SelectOption[]; placeholder?: string };

type ColumnFilterCellProps = {
  filter: ColumnFilter;
  value: string;
  onChange: (param: string, value: string) => void;
  label: string;
};

export function ColumnFilterCell({ filter, value, onChange, label }: ColumnFilterCellProps) {
  if (filter.type === 'multi') {
    return (
      <MultiSelect
        ariaLabel={`Фільтр: ${label}`}
        options={filter.options}
        placeholder={filter.placeholder ?? 'Усі'}
        values={value ? value.split(',').filter(Boolean) : []}
        onChange={(next) => onChange(filter.param, next.join(','))}
      />
    );
  }

  if (filter.type === 'select') {
    return (
      <Select
        variant="filter"
        ariaLabel={`Фільтр: ${label}`}
        options={[{ value: '', label: filter.placeholder ?? 'Усі' }, ...filter.options]}
        value={value}
        onChange={(next) => onChange(filter.param, next)}
      />
    );
  }

  return <TextColumnFilter filter={filter} value={value} onChange={onChange} label={label} />;
}

/** Keeps typing responsive by holding the draft locally and pushing it to the URL after a pause. */
function TextColumnFilter({ filter, value, onChange, label }: ColumnFilterCellProps) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft.trim(), 300);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (debounced !== value) {
      onChange(filter.param, debounced);
    }
    // `onChange` and `value` are intentionally omitted: this effect only reacts to a settled draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <span className={`column-filter-text${draft ? ' has-value' : ''}`}>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={filter.placeholder ?? 'Фільтр…'}
        aria-label={`Фільтр: ${label}`}
      />
      {draft ? (
        <button type="button" aria-label="Очистити фільтр" onClick={() => setDraft('')}>
          <X size={12} />
        </button>
      ) : null}
    </span>
  );
}
