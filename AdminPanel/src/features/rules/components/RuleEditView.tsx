'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel } from '@/lib/duplicate';
import { rulesApi } from '../api';
import { ACCENT_OPTIONS, type RuleItem } from '../types';
import { CreateRuleButton } from './CreateRuleButton';

export function RuleEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [item, setItem] = useState<RuleItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accent, setAccent] = useState('1');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { dirty, markSaved } = useDirtyForm({ title, description, accent }, Boolean(item));

  useEffect(() => {
    rulesApi
      .get(id)
      .then((rule) => {
        setItem(rule);
        setTitle(rule.title);
        setDescription(rule.description);
        setAccent(String(rule.accent));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const rule = await rulesApi.update(id, {
        title,
        description,
        accent: Number(accent),
      });
      setItem(rule);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    if (!window.confirm(`Видалити «${item.title}»?`)) return;
    setError('');
    try {
      await rulesApi.remove(item.id);
      router.replace('/rules');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const created = await rulesApi.create({
        title: withCopyLabel(title),
        description,
        accent: Number(accent),
      });
      router.push(`/rules/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/rules" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHead
        sticky
        backHref="/rules"
        backLabel="До правил"
        title={item.title}
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
            <CreateRuleButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            <button className="btn" type="submit" form="rule-form" disabled={busy || !dirty}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <RecordActionsMenu
              createLabel="Нове правило"
              onCreate={() => setCreateOpen(true)}
              onDuplicate={() => void onDuplicate()}
              duplicateBusy={duplicating}
              onDelete={onDelete}
            />
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Правило</h3>
        </div>
        <form className="form-box" id="rule-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <label htmlFor="title">Заголовок</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={180} />
          <label htmlFor="description">Текст</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={2}
            maxLength={320}
            rows={4}
          />
          <label htmlFor="accent">Колір номера</label>
          <Select id="accent" value={accent} onChange={setAccent} options={ACCENT_OPTIONS} />
        </form>
      </div>
    </>
  );
}
