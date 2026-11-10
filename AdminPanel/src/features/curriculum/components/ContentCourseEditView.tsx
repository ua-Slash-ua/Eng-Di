'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { MultiSelect } from '@/components/fields/MultiSelect';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { curriculumApi } from '../api';
import type { ContentCourse, ContentLevel, ContentUnit } from '../types';

export function ContentCourseEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const isNew = id === 'new';
  const router = useRouter();

  const [item, setItem] = useState<ContentCourse | null>(null);
  const [levels, setLevels] = useState<ContentLevel[]>([]);
  const [allUnits, setAllUnits] = useState<ContentUnit[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [levelId, setLevelId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState('0');
  const [unitIds, setUnitIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const { dirty, markSaved } = useDirtyForm(
    { title, description, levelId, sortOrder, unitIds },
    isNew || Boolean(item),
  );

  useEffect(() => {
    Promise.all([curriculumApi.listLevels(), curriculumApi.listUnits()])
      .then(([nextLevels, nextUnits]) => {
        setLevels(nextLevels);
        setAllUnits(nextUnits);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    curriculumApi
      .getCourse(Number(id))
      .then((data) => {
        setItem(data);
        setTitle(data.title);
        setDescription(data.description ?? '');
        setLevelId(data.levelId != null ? String(data.levelId) : '');
        setSortOrder(String(data.sortOrder));
        setUnitIds((data.units ?? []).map((unit) => unit.id));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id, isNew]);

  const unitOptions = useMemo(
    () =>
      allUnits.map((unit) => {
        const assignedElsewhere =
          unit.courseId != null &&
          unit.courseId !== (isNew ? null : Number(id)) &&
          !unitIds.includes(unit.id);
        return {
          id: unit.id,
          title: unit.title,
          subtitle: assignedElsewhere
            ? `Зараз у курсі: ${unit.course?.title ?? `#${unit.courseId}`}`
            : unit.courseId == null && !unitIds.includes(unit.id)
              ? 'Вільний юніт'
              : undefined,
        };
      }),
    [allUnits, id, isNew, unitIds],
  );

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    setOk('');
    setBusy(true);
    try {
      const body = {
        title,
        description: description || undefined,
        levelId: levelId ? Number(levelId) : null,
        sortOrder: Number(sortOrder),
        unitIds,
      };
      if (isNew) {
        const created = await curriculumApi.createCourse({
          title: body.title,
          description: body.description,
          levelId: body.levelId,
          sortOrder: body.sortOrder,
        });
        if (unitIds.length) {
          await curriculumApi.updateCourse(created.id, { unitIds });
        }
        router.replace(`/materials/courses/${created.id}`);
        return;
      }
      const updated = await curriculumApi.updateCourse(Number(id), body);
      setItem(updated);
      setUnitIds((updated.units ?? []).map((unit) => unit.id));
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
    if (!window.confirm(`Видалити курс «${item.title}»?`)) return;
    try {
      await curriculumApi.removeCourse(item.id);
      router.replace('/materials/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  if (error && !item && !isNew) return <LoadError message={error} href="/materials/courses" />;
  if (!isNew && !item) return <LoadingState />;

  return (
    <>
      <PageHead
        sticky
        backHref="/materials/courses"
        backLabel="До курсів"
        title={isNew ? 'Новий курс' : (item?.title ?? '')}
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
            <button className="btn" type="submit" form="course-form" disabled={busy || (!isNew && !dirty)}>
              {busy ? 'Збереження…' : isNew ? 'Створити' : 'Зберегти'}
            </button>
            {!isNew && <RecordActionsMenu onDelete={onDelete} />}
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Курс</h3>
        </div>
        <form className="form-box" id="course-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <label htmlFor="course-title">Назва</label>
          <input
            id="course-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={180}
          />
          <label htmlFor="course-desc">Опис</label>
          <textarea
            id="course-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <label htmlFor="course-level">Рівень</label>
          <Select
            id="course-level"
            value={levelId}
            onChange={setLevelId}
            placeholder="— Без рівня —"
            options={[
              { value: '', label: '— Без рівня —' },
              ...levels.map((l) => ({
                value: String(l.id),
                label: `${l.code} — ${l.title}`,
              })),
            ]}
          />
          <label htmlFor="course-order">Порядок</label>
          <input
            id="course-order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
          />
        </form>
      </div>

      <div className="panel" style={{ marginTop: '1.1111vw' }}>
        <div className="panel-head">
          <h3>Юніти курсу</h3>
        </div>
        <div className="form-box">
          <MultiSelect
            title="Присвоєні юніти"
            hint="Оберіть юніти для цього курсу. Юніт може бути лише в одному курсі."
            placeholder="Додати юніт…"
            emptyText="Юнітів не знайдено"
            icon={<Layers size={15} />}
            options={unitOptions}
            value={unitIds}
            onChange={setUnitIds}
          />
        </div>
      </div>
    </>
  );
}
