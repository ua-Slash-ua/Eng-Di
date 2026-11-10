'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { curriculumApi } from '../api';
import type { ContentLesson, ContentUnit, LessonPresentation, LinkedTest } from '../types';
import { LessonLinkedTestsPanel } from './LessonLinkedTestsPanel';
import { LessonPresentationField } from './LessonPresentationField';

type LessonEditTab = 'general' | 'materials';

export function ContentLessonEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const isNew = id === 'new';
  const router = useRouter();

  const [tab, setTab] = useState<LessonEditTab>('general');
  const [item, setItem] = useState<ContentLesson | null>(null);
  const [units, setUnits] = useState<ContentUnit[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unitId, setUnitId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState('0');
  const [presentation, setPresentation] = useState<LessonPresentation | null>(null);
  const [linkedTests, setLinkedTests] = useState<LinkedTest[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const { dirty, markSaved } = useDirtyForm({ title, description, unitId, sortOrder }, isNew || Boolean(item));

  useEffect(() => {
    curriculumApi.listUnits().then(setUnits).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    curriculumApi
      .getLesson(Number(id))
      .then((data) => {
        setItem(data);
        setTitle(data.title);
        setDescription(data.description ?? '');
        setUnitId(data.unitId != null ? String(data.unitId) : '');
        setSortOrder(String(data.sortOrder));
        setPresentation(data.presentation ?? null);
        setLinkedTests(data.linkedTests ?? []);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id, isNew]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const body = {
        title,
        description: description || undefined,
        unitId: unitId ? Number(unitId) : null,
        sortOrder: Number(sortOrder),
      };
      if (isNew) {
        const created = await curriculumApi.createLesson(body);
        router.replace(`/materials/lessons/${created.id}`);
        return;
      }
      const updated = await curriculumApi.updateLesson(Number(id), body);
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
    if (!window.confirm(`Видалити урок «${item.title}»?`)) return;
    try {
      await curriculumApi.removeLesson(item.id);
      router.replace('/materials/lessons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  if (error && !item && !isNew) return <LoadError message={error} href="/materials/lessons" />;
  if (!isNew && !item) return <LoadingState />;

  const materialsCount = (presentation ? 1 : 0) + linkedTests.length;

  return (
    <>
      <PageHead
        sticky
        backHref="/materials/lessons"
        backLabel="До уроків"
        title={isNew ? 'Новий урок' : (item?.title ?? '')}
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
            {tab === 'general' ? (
              <button className="btn" type="submit" form="lesson-form" disabled={busy || (!isNew && !dirty)}>
                {busy ? 'Збереження…' : isNew ? 'Створити' : 'Зберегти'}
              </button>
            ) : null}
            {!isNew && <RecordActionsMenu onDelete={onDelete} />}
          </>
        }
      />

      <div className="panel lesson-edit-panel">
        <div className="lesson-edit-tabs" role="tablist" aria-label="Розділи уроку">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'general'}
            className={`lesson-edit-tab${tab === 'general' ? ' is-active' : ''}`}
            onClick={() => setTab('general')}
          >
            Загальне
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'materials'}
            className={`lesson-edit-tab${tab === 'materials' ? ' is-active' : ''}`}
            onClick={() => setTab('materials')}
            disabled={isNew}
          >
            Матеріали
            {materialsCount ? <span className="lesson-edit-tab-badge">{materialsCount}</span> : null}
          </button>
        </div>

        <div className="lesson-edit-body">
          {tab === 'general' ? (
            <form className="form-box lesson-edit-form" id="lesson-form" onSubmit={onSave}>
              <FormAlerts error={error} ok={ok} />
              <label htmlFor="lesson-title">Назва</label>
              <input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={220}
              />
              <label htmlFor="lesson-desc">Опис</label>
              <textarea
                id="lesson-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <label htmlFor="lesson-unit">Юніт</label>
              <Select
                id="lesson-unit"
                value={unitId}
                onChange={setUnitId}
                placeholder="— Вільний урок (без юніта) —"
                options={[
                  { value: '', label: '— Вільний урок (без юніта) —' },
                  ...units.map((u) => ({
                    value: String(u.id),
                    label: u.course ? `${u.title} (${u.course.title})` : u.title,
                  })),
                ]}
              />
              <label htmlFor="lesson-order">Порядок</label>
              <input
                id="lesson-order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                min={0}
              />
            </form>
          ) : null}

          {tab === 'materials' && item ? (
            <div className="form-box lesson-edit-form">
              <LessonPresentationField
                lessonId={item.id}
                presentation={presentation}
                onChange={setPresentation}
              />
              <LessonLinkedTestsPanel tests={linkedTests} lessonId={item.id} />
            </div>
          ) : null}

          {tab === 'materials' && isNew ? (
            <div className="lesson-edit-placeholder">
              <p className="muted">Спочатку створіть урок на вкладці «Загальне», потім додайте матеріали.</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
