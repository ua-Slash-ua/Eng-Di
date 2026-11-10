'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConfirmDialog, type UsageItem } from '@/components/ConfirmDialog';
import { IconPicker } from '@/components/fields/IconPicker';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel } from '@/lib/duplicate';
import { aboutStatsApi } from '../api';
import { BLOCK_TYPE_LABELS, type AboutStatItem } from '../types';
import { CreateAboutStatButton } from './CreateAboutStatButton';

export function AboutStatEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [item, setItem] = useState<AboutStatItem | null>(null);
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [usage, setUsage] = useState<UsageItem[] | undefined>(undefined);
  const [usageLoading, setUsageLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { dirty, markSaved } = useDirtyForm({ value, label, icon }, Boolean(item));

  useEffect(() => {
    if (!id) return;
    aboutStatsApi
      .get(id)
      .then((stat) => {
        setItem(stat);
        setValue(stat.value);
        setLabel(stat.label);
        setIcon(stat.icon ?? '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const stat = await aboutStatsApi.update(id, {
        value,
        label,
        icon,
      });
      setItem(stat);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  function askDelete() {
    setConfirmOpen(true);
    setUsage(undefined);
    setUsageLoading(true);
    aboutStatsApi
      .usage(id)
      .then((rows) =>
        setUsage(
          rows.map((row) => ({
            id: row.id,
            label: row.name,
            hint: BLOCK_TYPE_LABELS[row.type] || row.type,
            href: `/blocks/${row.id}`,
          })),
        ),
      )
      .catch(() => setUsage([]))
      .finally(() => setUsageLoading(false));
  }

  async function onDelete() {
    if (!item) return;
    setRemoving(true);
    setError('');
    try {
      await aboutStatsApi.remove(item.id);
      router.replace('/about-stats');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
      setConfirmOpen(false);
    } finally {
      setRemoving(false);
    }
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const created = await aboutStatsApi.create({
        value: withCopyLabel(value, 40),
        label,
        icon,
      });
      router.push(`/about-stats/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/about-stats" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHead
        sticky
        backHref="/about-stats"
        backLabel="До цифр"
        title={item.value}
        description={
          <MetaBar
            items={[
              { label: 'Оновлено', value: formatDateTime(item.updatedAt) },
              { label: 'Створено', value: formatDateTime(item.createdAt) },
            ]}
          />
        }
        actions={
          <>
            <CreateAboutStatButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            <button className="btn" type="submit" form="stat-form" disabled={busy || !dirty}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <RecordActionsMenu
              createLabel="Новий запис"
              onCreate={() => setCreateOpen(true)}
              onDuplicate={() => void onDuplicate()}
              duplicateBusy={duplicating}
              onDelete={askDelete}
            />
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Запис</h3>
        </div>
        <form className="form-box" id="stat-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <label htmlFor="value">Значення</label>
          <input id="value" value={value} onChange={(e) => setValue(e.target.value)} required maxLength={40} />
          <label htmlFor="label">Підпис</label>
          <input id="label" value={label} onChange={(e) => setLabel(e.target.value)} required maxLength={120} />
          <IconPicker id="icon" value={icon} onChange={setIcon} />
        </form>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Видалити запис?"
        message={`Запис «${item.value}» зникне з усіх блоків, де його обрано. Замість нього підставимо наступний з каталогу.`}
        usage={usage}
        usageLoading={usageLoading}
        usageEmpty="Запис ніде не обрано."
        busy={removing}
        onConfirm={onDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
