'use client';

import { Select, type SelectOption } from '@/components/ui/Select';

type RecordActionsMenuProps = {
  /** Label for the create action, e.g. «Новий блок». Omit to hide create. */
  createLabel?: string;
  onCreate?: () => void;
  onDuplicate?: () => void;
  duplicateBusy?: boolean;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  disabled?: boolean;
};

export function RecordActionsMenu({
  createLabel = 'Новий запис',
  onCreate,
  onDuplicate,
  duplicateBusy = false,
  onDelete,
  deleteDisabled = false,
  disabled = false,
}: RecordActionsMenuProps) {
  const options: SelectOption[] = [];
  if (onCreate) options.push({ value: 'create', label: createLabel });
  if (onDuplicate) {
    options.push({ value: 'duplicate', label: duplicateBusy ? 'Копіювання…' : 'Дублювати' });
  }
  if (onDelete && !deleteDisabled) {
    options.push({ value: 'delete', label: 'Видалити', danger: true });
  }

  if (!options.length) return null;

  return (
    <Select
      variant="compact"
      menuAlign="end"
      menuMinWidth={180}
      value=""
      placeholder="Дії"
      ariaLabel="Дії з записом"
      disabled={disabled || duplicateBusy}
      options={options}
      onChange={(value) => {
        if (value === 'create') onCreate?.();
        else if (value === 'duplicate') onDuplicate?.();
        else if (value === 'delete') onDelete?.();
      }}
    />
  );
}
