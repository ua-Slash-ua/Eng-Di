'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { MetaBar, formatDateTime } from '@/components/MetaBar';
import { MultiSelect } from '@/components/fields/MultiSelect';
import { FormAlerts, LoadError, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { RecordActionsMenu } from '@/components/ui/RecordActionsMenu';
import { Select } from '@/components/ui/Select';
import { useDirtyForm } from '@/hooks/useDirtyForm';
import { curriculumApi } from '../api';
import type { ContentCourse, ContentLesson, ContentUnit } from '../types';

export function ContentUnitEditView() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const isNew = id === 'new';
  const router = useRouter();

  const [item, setItem] = useState<ContentUnit | null>(null);
  const [courses, setCourses] = useState<ContentCourse[]>([]);
  const [allLessons, setAllLessons] = useState<ContentLesson[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  const [sortOrder, setSortOrder] = useState('0');
  const [lessonIds, setLessonIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const { dirty, markSaved } = useDirtyForm(
    { title, description, courseId, sortOrder, lessonIds },
    isNew || Boolean(item),
  );

  useEffect(() => {
    Promise.all([curriculumApi.listCourses(), curriculumApi.listLessons()])
      .then(([nextCourses, nextLessons]) => {
        setCourses(nextCourses);
        setAllLessons(nextLessons);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    curriculumApi
      .getUnit(Number(id))
      .then((data) => {
        setItem(data);
        setTitle(data.title);
        setDescription(data.description ?? '');
        setCourseId(data.courseId != null ? String(data.courseId) : '');
        setSortOrder(String(data.sortOrder));
        setLessonIds((data.lessons ?? []).map((lesson) => lesson.id));
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id, isNew]);

  const lessonOptions = useMemo(
    () =>
      allLessons.map((lesson) => {
        const assignedElsewhere =
          lesson.unitId != null &&
          lesson.unitId !== (isNew ? null : Number(id)) &&
          !lessonIds.includes(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          subtitle: assignedElsewhere
            ? `Зараз у юніті: ${lesson.unit?.title ?? `#${lesson.unitId}`}`
            : lesson.unitId == null && !lessonIds.includes(lesson.id)
              ? 'Вільний урок'
              : undefined,
        };
      }),
    [allLessons, id, isNew, lessonIds],
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
        courseId: courseId ? Number(courseId) : null,
        sortOrder: Number(sortOrder),
        lessonIds,
      };
      if (isNew) {
        const created = await curriculumApi.createUnit({
          title: body.title,
          description: body.description,
          courseId: body.courseId,
          sortOrder: body.sortOrder,
        });
        if (lessonIds.length) {
          await curriculumApi.updateUnit(created.id, { lessonIds });
        }
        router.replace(`/materials/units/${created.id}`);
        return;
      }
      const updated = await curriculumApi.updateUnit(Number(id), body);
      setItem(updated);
      setLessonIds((updated.lessons ?? []).map((lesson) => lesson.id));
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
    if (!window.confirm(`Видалити юніт «${item.title}»?`)) return;
    try {
      await curriculumApi.removeUnit(item.id);
      router.replace('/materials/units');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    }
  }

  if (error && !item && !isNew) return <LoadError message={error} href="/materials/units" />;
  if (!isNew && !item) return <LoadingState />;

  return (
    <>
      <PageHead
        sticky
        backHref="/materials/units"
        backLabel="До юнітів"
        title={isNew ? 'Новий юніт' : (item?.title ?? '')}
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
            <button className="btn" type="submit" form="unit-form" disabled={busy || (!isNew && !dirty)}>
              {busy ? 'Збереження…' : isNew ? 'Створити' : 'Зберегти'}
            </button>
            {!isNew && <RecordActionsMenu onDelete={onDelete} />}
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Юніт</h3>
        </div>
        <form className="form-box" id="unit-form" onSubmit={onSave}>
          <FormAlerts error={error} ok={ok} />
          <label htmlFor="unit-title">Назва</label>
          <input
            id="unit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={180}
          />
          <label htmlFor="unit-desc">Опис</label>
          <textarea
            id="unit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <label htmlFor="unit-course">Курс</label>
          <Select
            id="unit-course"
            value={courseId}
            onChange={setCourseId}
            placeholder="— Вільний юніт (без курсу) —"
            options={[
              { value: '', label: '— Вільний юніт (без курсу) —' },
              ...courses.map((c) => ({
                value: String(c.id),
                label: c.level ? `${c.title} (${c.level.code})` : c.title,
              })),
            ]}
          />
          <label htmlFor="unit-order">Порядок</label>
          <input
            id="unit-order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            min={0}
          />
        </form>
      </div>

      <div className="panel" style={{ marginTop: '1.1111vw' }}>
        <div className="panel-head">
          <h3>Уроки юніта</h3>
        </div>
        <div className="form-box">
          <MultiSelect
            title="Присвоєні уроки"
            hint="Оберіть уроки для цього юніта. Урок може бути лише в одному юніті."
            placeholder="Додати урок…"
            emptyText="Уроків не знайдено"
            icon={<BookOpen size={15} />}
            options={lessonOptions}
            value={lessonIds}
            onChange={setLessonIds}
          />
        </div>
      </div>
    </>
  );
}
