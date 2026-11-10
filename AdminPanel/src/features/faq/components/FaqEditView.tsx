'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { withCopyLabel } from '@/lib/duplicate';
import { faqsApi } from '../api';
import type { FaqItem } from '../types';
import { CreateFaqButton } from './CreateFaqButton';

export function FaqEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const router = useRouter();
  const [item, setItem] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { dirty, markSaved } = useDirtyForm({ question, answer }, Boolean(item));

  useEffect(() => {
    if (!id) return;
    faqsApi
      .get(id)
      .then((faq) => {
        setItem(faq);
        setQuestion(faq.question);
        setAnswer(faq.answer);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const faq = await faqsApi.update(id, { question, answer });
      setItem(faq);
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
    if (!window.confirm(`Видалити питання «${item.question}»?`)) return;
    setError('');
    try {
      await faqsApi.remove(item.id);
      router.replace('/faq');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  async function onDuplicate() {
    setDuplicating(true);
    setError('');
    try {
      const created = await faqsApi.create({
        question: withCopyLabel(question, 220),
        answer,
      });
      router.push(`/faq/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося дублювати');
    } finally {
      setDuplicating(false);
    }
  }

  if (error && !item) {
    return <LoadError message={error} href="/faq" />;
  }

  if (!item) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHead
        sticky
        backHref="/faq"
        backLabel="До FAQ"
        title={item.question}
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
            <CreateFaqButton hideTrigger open={createOpen} onOpenChange={setCreateOpen} />
            <button className="btn" type="submit" form="faq-form" disabled={busy || !dirty}>
              {busy ? 'Збереження…' : 'Зберегти'}
            </button>
            <RecordActionsMenu
              createLabel="Нове питання"
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
          <h3>Питання</h3>
        </div>
        <form className="form-box" id="faq-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <label htmlFor="question">Питання</label>
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            minLength={2}
            maxLength={220}
          />
          <label htmlFor="answer">Відповідь</label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            minLength={2}
            maxLength={600}
            rows={5}
          />
        </form>
      </div>
    </>
  );
}
