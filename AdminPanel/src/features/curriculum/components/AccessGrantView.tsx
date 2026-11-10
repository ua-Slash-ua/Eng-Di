'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { api } from '@/lib/api';
import { curriculumApi } from '../api';
import type {
  ContentCourse,
  ContentLesson,
  ContentLevel,
  ContentUnit,
  TeacherAccess,
} from '../types';

type Teacher = { id: number; name: string; email: string };
type EntityType = 'level' | 'course' | 'unit' | 'lesson';

export function AccessGrantView() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [levels, setLevels] = useState<ContentLevel[]>([]);
  const [courses, setCourses] = useState<ContentCourse[]>([]);
  const [units, setUnits] = useState<ContentUnit[]>([]);
  const [lessons, setLessons] = useState<ContentLesson[]>([]);
  const [accesses, setAccesses] = useState<TeacherAccess[]>([]);

  const [teacherId, setTeacherId] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('lesson');
  const [entityId, setEntityId] = useState('');
  const [mode, setMode] = useState<'readonly' | 'fork'>('readonly');

  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('');

  useEffect(() => {
    api<{ users: Teacher[] }>('/api/admin/users?role=teacher&limit=200')
      .then((res) => setTeachers(res.users))
      .catch(() => {});
    curriculumApi.listLevels().then(setLevels).catch(() => {});
    curriculumApi.listCourses().then(setCourses).catch(() => {});
    curriculumApi.listUnits().then(setUnits).catch(() => {});
    curriculumApi.listLessons().then(setLessons).catch(() => {});
    curriculumApi.listAccesses().then(setAccesses).catch(() => {});
  }, []);

  const entityOptions = useMemo(() => {
    if (entityType === 'level') {
      return levels.map((l) => ({ value: String(l.id), label: `${l.code} — ${l.title}` }));
    }
    if (entityType === 'course') {
      return courses.map((c) => ({
        value: String(c.id),
        label: c.level ? `${c.title} (${c.level.code})` : c.title,
      }));
    }
    if (entityType === 'unit') {
      return units.map((u) => ({
        value: String(u.id),
        label: u.course ? `${u.title} · ${u.course.title}` : u.title,
      }));
    }
    return lessons.map((l) => ({
      value: String(l.id),
      label: l.unit ? `${l.title} · ${l.unit.title}` : l.title,
    }));
  }, [entityType, levels, courses, units, lessons]);

  async function onGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherId || !entityId) return;
    setError('');
    setOk('');
    setBusy(true);
    try {
      const access = await curriculumApi.grantAccess({
        teacherId: Number(teacherId),
        entityType,
        entityId: Number(entityId),
        mode,
      });
      setAccesses((prev) => {
        const filtered = prev.filter((a) => a.id !== access.id);
        return [access, ...filtered];
      });
      setOk('Доступ надано');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: number) {
    if (!window.confirm('Відкликати доступ?')) return;
    try {
      await curriculumApi.revokeAccess(id);
      setAccesses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося відкликати');
    }
  }

  const entityTypeLabel = (t: EntityType) =>
    t === 'level' ? 'Рівень' : t === 'course' ? 'Курс' : t === 'unit' ? 'Юніт' : 'Урок';
  const modeLabel = (m: 'readonly' | 'fork') => (m === 'readonly' ? 'Лише використання' : 'Форк');

  const entityLabelByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of levels) map.set(`level:${item.id}`, `${item.code} — ${item.title}`);
    for (const item of courses) map.set(`course:${item.id}`, item.title);
    for (const item of units) map.set(`unit:${item.id}`, item.title);
    for (const item of lessons) map.set(`lesson:${item.id}`, item.title);
    return map;
  }, [levels, courses, units, lessons]);

  const filteredAccesses = filterTeacher
    ? accesses.filter((a) => String(a.teacherId) === filterTeacher)
    : accesses;

  const columns = useMemo<Column<TeacherAccess>[]>(
    () => [
      {
        key: 'teacher',
        header: 'Вчитель',
        render: (item) => (
          <>
            <div className="student-name">{item.teacher.name}</div>
            <div className="student-email">{item.teacher.email}</div>
          </>
        ),
      },
      {
        key: 'type',
        header: 'Тип',
        width: '9.0278vw',
        render: (item) => entityTypeLabel(item.entityType),
      },
      {
        key: 'entity',
        header: 'Елемент',
        render: (item) =>
          entityLabelByKey.get(`${item.entityType}:${item.entityId}`) ?? (
            <span className="muted">#{item.entityId}</span>
          ),
      },
      {
        key: 'mode',
        header: 'Режим',
        width: '11.1111vw',
        render: (item) => modeLabel(item.mode),
      },
      {
        key: 'grantedAt',
        header: 'Надано',
        width: '11.1111vw',
        render: (item) => new Date(item.grantedAt).toLocaleDateString('uk-UA'),
      },
      {
        key: 'actions',
        header: '',
        width: '9.7222vw',
        render: (item) => (
          <button
            type="button"
            className="btn ghost btn-sm"
            onClick={(event) => {
              event.stopPropagation();
              void onRevoke(item.id);
            }}
          >
            Відкликати
          </button>
        ),
      },
    ],
    [entityLabelByKey],
  );

  return (
    <>
      <PageHead
        title="Доступ до матеріалів"
        description="Надати вчителю доступ до рівня, курсу, юніту або уроку."
      />

      <div className="panel curriculum-access-form">
        <div className="panel-head">
          <h3>Надати доступ</h3>
        </div>
        <form className="form-box" onSubmit={onGrant}>
          <FormAlerts error={error} ok={ok} />

          <div className="curriculum-access-grid">
            <div className="curriculum-access-field">
              <label htmlFor="access-teacher">Вчитель</label>
              <Select
                id="access-teacher"
                value={teacherId}
                onChange={setTeacherId}
                placeholder="— Оберіть вчителя —"
                options={teachers.map((t) => ({
                  value: String(t.id),
                  label: t.name,
                  hint: t.email,
                }))}
              />
            </div>

            <div className="curriculum-access-field">
              <label htmlFor="access-type">Тип</label>
              <Select
                id="access-type"
                value={entityType}
                onChange={(value) => {
                  setEntityType(value as EntityType);
                  setEntityId('');
                }}
                options={[
                  { value: 'lesson', label: 'Урок' },
                  { value: 'unit', label: 'Юніт' },
                  { value: 'course', label: 'Курс' },
                  { value: 'level', label: 'Рівень' },
                ]}
              />
            </div>

            <div className="curriculum-access-field">
              <label htmlFor="access-entity">{entityTypeLabel(entityType)}</label>
              <Select
                id="access-entity"
                value={entityId}
                onChange={setEntityId}
                placeholder="— Оберіть —"
                options={entityOptions}
              />
            </div>

            <div className="curriculum-access-field">
              <label htmlFor="access-mode">Режим</label>
              <Select
                id="access-mode"
                value={mode}
                onChange={(value) => setMode(value as 'readonly' | 'fork')}
                options={[
                  {
                    value: 'readonly',
                    label: 'Лише використання',
                    hint: 'Можна змінити лише порядок',
                  },
                  {
                    value: 'fork',
                    label: 'Форк',
                    hint: 'Власна копія з повним редагуванням',
                  },
                ]}
              />
            </div>
          </div>

          <div className="curriculum-access-actions">
            <button className="btn" type="submit" disabled={busy || !teacherId || !entityId}>
              {busy ? 'Збереження…' : 'Надати доступ'}
            </button>
          </div>
        </form>
      </div>

      <DataTable
        columns={columns}
        items={filteredAccesses}
        rowKey={(item) => item.id}
        emptyText="Доступів не знайдено"
        filters={
          <Select
            variant="compact"
            value={filterTeacher}
            onChange={setFilterTeacher}
            placeholder="Усі вчителі"
            ariaLabel="Фільтр по вчителю"
            options={[
              { value: '', label: 'Усі вчителі' },
              ...teachers.map((t) => ({ value: String(t.id), label: t.name })),
            ]}
          />
        }
      />
    </>
  );
}
