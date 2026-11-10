'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { pagePath } from '@/lib/format';
import { leadCategoriesApi, leadsApi } from '../api';
import { LEAD_STATUS_LABELS, LEAD_STATUS_OPTIONS, type Lead, type LeadCategory, type LeadStatus } from '../types';

export function LeadEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [item, setItem] = useState<Lead | null>(null);
  const [categories, setCategories] = useState<LeadCategory[]>([]);
  const [status, setStatus] = useState<LeadStatus>('NEW');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const { dirty, markSaved } = useDirtyForm({ status, categoryId }, Boolean(item));

  useEffect(() => {
    if (!id) return;
    leadCategoriesApi.list().then(setCategories).catch(() => undefined);
    leadsApi
      .get(id)
      .then((lead) => {
        setItem(lead);
        setStatus(lead.status);
        setCategoryId(lead.category ? String(lead.category.id) : '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const lead = await leadsApi.update(id, {
        status,
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      });
      setItem(lead);
      markSaved();
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/leads" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHead
        sticky
        backHref="/leads"
        backLabel="До заявок"
        title={item.name}
        description={
          <MetaBar
            items={[
              { label: 'Статус', value: LEAD_STATUS_LABELS[item.status] },
              { label: 'Сторінка', value: pagePath(item.location || '/') },
              { label: 'Створено', value: formatDateTime(item.createdAt) },
            ]}
          />
        }
        actions={
          <button className="btn" type="submit" form="lead-form" disabled={busy || !dirty}>
            {busy ? 'Збереження…' : 'Зберегти'}
          </button>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Заявка</h3>
        </div>
        <form className="form-box" id="lead-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <label htmlFor="status">Статус</label>
          <Select
            id="status"
            value={status}
            onChange={(next) => setStatus(next as LeadStatus)}
            options={LEAD_STATUS_OPTIONS}
          />
          <label htmlFor="category">Категорія</label>
          <Select
            id="category"
            value={categoryId}
            onChange={setCategoryId}
            options={[
              { value: '', label: 'Без категорії' },
              ...categories.map((cat) => ({ value: String(cat.id), label: cat.title })),
            ]}
          />
          <label>Телефон</label>
          <input value={item.phone} disabled />
          <label>Email</label>
          <input value={item.email || '—'} disabled />
          <label>Сторінка</label>
          <input className="mono" value={pagePath(item.location || '/')} disabled />
          <label>Повідомлення</label>
          <textarea value={item.message || '—'} disabled rows={3} />
        </form>
      </div>
    </>
  );
}
