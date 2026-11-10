'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { curriculumApi } from '../api';
import type { ContentLevel } from '../types';

export function ContentLevelEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const isNew = id === 'new';
  const router = useRouter();

  const [item, setItem] = useState<ContentLevel | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const { dirty, markSaved } = useDirtyForm({ code, title, description, sortOrder }, isNew || Boolean(item));

  useEffect(() => {
    if (isNew) return;
    curriculumApi
      .getLevel(Number(id))
      .then((data) => {
        setItem(data);
        setCode(data.code);
        setTitle(data.title);
        setDescription(data.description ?? '');
        setSortOrder(String(data.sortOrder));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id, isNew]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const body = { code, title, description: description || undefined, sortOrder: Number(sortOrder) };
      if (isNew) {
        const created = await curriculumApi.createLevel(body);
        router.replace(`/materials/levels/${created.id}`);
        return;
      }
      const updated = await curriculumApi.updateLevel(Number(id), body);
      setItem(updated);
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
    if (!window.confirm(`Видалити рівень «${item.code}»?`)) return;
    try {
      await curriculumApi.removeLevel(item.id);
      router.replace('/materials/levels');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  if (error && !item && !isNew) return <LoadError message={error} href="/materials/levels" />;
  if (!isNew && !item) return <LoadingState />;

  return (
    <>
      <PageHead
        sticky
        backHref="/materials/levels"
        backLabel="До рівнів"
        title={isNew ? 'Новий рівень' : `${item?.code ?? ''} — ${item?.title ?? ''}`}
        description={
          !isNew && item ? (
            <MetaBar
              items={[
                { label: 'Оновлено', value: formatDateTime(item.updatedAt) },
                { label: 'Створено', value: formatDateTime(item.createdAt) },
              ]}
            />
          ) : undefined
        }
        actions={
          <>
            <button className="btn" type="submit" form="level-form" disabled={busy || (!isNew && !dirty)}>
              {busy ? 'Збереження…' : isNew ? 'Створити' : 'Зберегти'}
            </button>
            {!isNew && <RecordActionsMenu onDelete={onDelete} />}
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Рівень</h3>
        </div>
        <form className="form-box" id="level-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <label htmlFor="level-code">Код (A1, B2 тощо)</label>
          <input
            id="level-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            maxLength={8}
            placeholder="A1"
          />
          <label htmlFor="level-title">Назва</label>
          <input
            id="level-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
          <label htmlFor="level-desc">Опис</label>
          <textarea
            id="level-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={320}
            rows={3}
          />
          <label htmlFor="level-order">Порядок</label>
          <input
            id="level-order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
          />
        </form>
      </div>
    </>
  );
}
