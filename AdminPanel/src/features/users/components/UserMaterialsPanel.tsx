'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { Select } from '@/components/ui/Select';
import { curriculumApi } from '@/features/curriculum/api';
import {
  countTreeNodes,
  entityTypeLabel,
  expandAccessGrant,
  type GrantTreeNode,
} from '@/features/curriculum/lib/grantTree';
import type {
  ContentCourse,
  ContentLesson,
  ContentLevel,
  ContentUnit,
  TeacherAccess,
} from '@/features/curriculum/types';
import type { User } from '../types';

type EntityType = TeacherAccess['entityType'];

const ENTITY_TYPE_OPTIONS = [
  { value: 'lesson', label: 'Урок', hint: 'Окремий урок' },
  { value: 'unit', label: 'Юніт', hint: 'Усі уроки юніту' },
  { value: 'course', label: 'Курс', hint: 'Усі юніти та уроки курсу' },
  { value: 'level', label: 'Рівень', hint: 'Уся ієрархія рівня' },
] as const;

const MODE_OPTIONS = [
  { value: 'readonly', label: 'Лише використання', hint: 'Можна змінити лише порядок' },
  { value: 'fork', label: 'Форк', hint: 'Власна копія з повним редагуванням' },
];

function modeLabel(mode: TeacherAccess['mode']) {
  return mode === 'readonly' ? 'Лише використання' : 'Форк';
}

function GrantTreeList({ nodes, depth = 0 }: { nodes: GrantTreeNode[]; depth?: number }) {
  if (!nodes.length) {
    return depth === 0 ? <p className="muted materials-tree-empty">Немає вкладених елементів</p> : null;
  }
  return (
    <ul className={`materials-tree${depth ? ' is-nested' : ''}`}>
      {nodes.map((node) => (
        <li key={node.key} className={`materials-tree-item is-${node.type}`}>
          <div className="materials-tree-row">
            <span className="materials-tree-type">{entityTypeLabel(node.type)}</span>
            <span className="materials-tree-title">{node.title}</span>
            {node.meta ? <span className="materials-tree-meta">{node.meta}</span> : null}
          </div>
          {node.children.length ? <GrantTreeList nodes={node.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

function GrantCard({
  access,
  tree,
  onRevoke,
}: {
  access: TeacherAccess;
  tree: GrantTreeNode | null;
  onRevoke: (id: number) => void;
}) {
  const counts = tree ? countTreeNodes(tree) : null;
  const summary =
    access.entityType === 'lesson'
      ? '1 урок'
      : access.entityType === 'unit'
        ? `${counts?.lessons ?? 0} уроків`
        : access.entityType === 'course'
          ? `${counts?.units ?? 0} юн. · ${counts?.lessons ?? 0} ур.`
          : `${counts?.courses ?? 0} курс. · ${counts?.units ?? 0} юн. · ${counts?.lessons ?? 0} ур.`;

  return (
    <article className="materials-grant-card">
      <div className="materials-grant-head">
        <div>
          <span className="materials-grant-type">{entityTypeLabel(access.entityType)}</span>
          <h4>{tree?.title ?? `#${access.entityId}`}</h4>
          <p className="muted materials-grant-summary">
            {summary} · {modeLabel(access.mode)} ·{' '}
            {new Date(access.grantedAt).toLocaleDateString('uk-UA')}
          </p>
        </div>
        <button type="button" className="btn ghost btn-sm" onClick={() => onRevoke(access.id)}>
          Відкликати
        </button>
      </div>
      {tree ? (
        <details className="materials-grant-details" open={access.entityType !== 'lesson'}>
          <summary>Що входить</summary>
          {access.entityType === 'lesson' ? (
            <p className="muted materials-tree-empty">{tree.meta ?? 'Окремий урок'}</p>
          ) : (
            <GrantTreeList nodes={tree.children} />
          )}
        </details>
      ) : null}
    </article>
  );
}

export function UserMaterialsPanel({ item }: { item: User }) {
  const [levels, setLevels] = useState<ContentLevel[]>([]);
  const [courses, setCourses] = useState<ContentCourse[]>([]);
  const [units, setUnits] = useState<ContentUnit[]>([]);
  const [lessons, setLessons] = useState<ContentLesson[]>([]);
  const [accesses, setAccesses] = useState<TeacherAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const [entityType, setEntityType] = useState<EntityType>('unit');
  const [levelId, setLevelId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [mode, setMode] = useState<'readonly' | 'fork'>('readonly');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    setLoading(true);
    setError('');
    try {
      const [levelRows, courseRows, unitRows, lessonRows, accessRows] = await Promise.all([
        curriculumApi.listLevels(),
        curriculumApi.listCourses(),
        curriculumApi.listUnits(),
        curriculumApi.listLessons(),
        curriculumApi.listAccesses(item.id),
      ]);
      setLevels(levelRows);
      setCourses(courseRows);
      setUnits(unitRows);
      setLessons(lessonRows);
      setAccesses(accessRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити матеріали');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [item.id]);

  const levelOptions = useMemo(
    () => [
      { value: '', label: 'Усі рівні' },
      ...levels.map((row) => ({ value: String(row.id), label: `${row.code} — ${row.title}` })),
    ],
    [levels],
  );

  const filteredCourses = useMemo(() => {
    if (!levelId) return courses;
    return courses.filter((row) => String(row.levelId ?? '') === levelId);
  }, [courses, levelId]);

  const filteredUnits = useMemo(() => {
    if (courseId) return units.filter((row) => String(row.courseId ?? '') === courseId);
    if (levelId) {
      const courseIds = new Set(filteredCourses.map((row) => row.id));
      return units.filter((row) => row.courseId != null && courseIds.has(row.courseId));
    }
    return units;
  }, [units, courseId, levelId, filteredCourses]);

  const filteredLessons = useMemo(() => {
    if (unitId) return lessons.filter((row) => String(row.unitId ?? '') === unitId);
    if (courseId) {
      const unitIds = new Set(filteredUnits.map((row) => row.id));
      return lessons.filter((row) => row.unitId != null && unitIds.has(row.unitId));
    }
    if (levelId) {
      const unitIds = new Set(filteredUnits.map((row) => row.id));
      return lessons.filter((row) => row.unitId != null && unitIds.has(row.unitId));
    }
    return lessons;
  }, [lessons, unitId, courseId, levelId, filteredUnits]);

  const selectedEntityId = useMemo(() => {
    if (entityType === 'level') return levelId;
    if (entityType === 'course') return courseId;
    if (entityType === 'unit') return unitId;
    return lessonId;
  }, [entityType, levelId, courseId, unitId, lessonId]);

  const grantCards = useMemo(
    () =>
      accesses.map((access) => ({
        access,
        tree: expandAccessGrant(access, levels, courses, units, lessons),
      })),
    [accesses, levels, courses, units, lessons],
  );

  function resetTarget(type: EntityType) {
    setEntityType(type);
    setLevelId('');
    setCourseId('');
    setUnitId('');
    setLessonId('');
  }

  function onEntityTypeChange(value: string) {
    resetTarget(value as EntityType);
  }

  async function onGrant(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedEntityId) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      const access = await curriculumApi.grantAccess({
        teacherId: item.id,
        entityType,
        entityId: Number(selectedEntityId),
        mode: item.userRole === 'student' ? 'readonly' : mode,
      });
      setAccesses((prev) => [access, ...prev.filter((row) => row.id !== access.id)]);
      setOk('Доступ надано');
      if (entityType === 'level') setLevelId('');
      if (entityType === 'course') setCourseId('');
      if (entityType === 'unit') setUnitId('');
      if (entityType === 'lesson') setLessonId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося надати доступ');
    } finally {
      setBusy(false);
    }
  }

  async function onRevoke(id: number) {
    if (!window.confirm('Відкликати цей доступ?')) return;
    setError('');
    try {
      await curriculumApi.revokeAccess(id);
      setAccesses((prev) => prev.filter((row) => row.id !== id));
      setOk('Доступ відкликано');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося відкликати');
    }
  }

  if (item.userRole !== 'teacher' && item.userRole !== 'student') {
    return (
      <div className="panel">
        <div className="panel-head">
          <h3>Матеріали</h3>
        </div>
        <div className="access-tab-body">
          <p className="muted">Присвоєння матеріалів доступне для вчителів і учнів.</p>
        </div>
      </div>
    );
  }

  const isStudent = item.userRole === 'student';

  return (
    <div className="panel materials-tab">
      <div className="panel-head">
        <h3>Матеріали</h3>
      </div>
      <div className="access-tab-body">
        <p className="muted class-hint">
          Можна присвоїти рівень, курс, юніт або окремі уроки. Юніт і курс автоматично включають усі
          підлеглі елементи; окремі уроки додаються точково.
          {isStudent
            ? ' Учень бачить присвоєне в розділі «Матеріали» (лише перегляд).'
            : null}
        </p>

        <FormAlerts error={error} ok={ok} />

        <form className="materials-grant-form" onSubmit={onGrant}>
          <div className="materials-grant-form-grid">
            <div className="curriculum-access-field">
              <label htmlFor="materials-type">Що присвоїти</label>
              <Select
                id="materials-type"
                value={entityType}
                onChange={onEntityTypeChange}
                options={[...ENTITY_TYPE_OPTIONS]}
              />
            </div>
            {!isStudent ? (
              <div className="curriculum-access-field">
                <label htmlFor="materials-mode">Режим</label>
                <Select
                  id="materials-mode"
                  value={mode}
                  onChange={(v) => setMode(v as 'readonly' | 'fork')}
                  options={[...MODE_OPTIONS]}
                />
              </div>
            ) : null}
          </div>

          <div className="materials-cascade">
            <div className="materials-cascade-step">
              <label htmlFor="materials-level">Рівень</label>
              <Select
                id="materials-level"
                value={levelId}
                onChange={(value) => {
                  setLevelId(value);
                  setCourseId('');
                  setUnitId('');
                  setLessonId('');
                }}
                placeholder={entityType === 'level' ? '— Оберіть рівень —' : undefined}
                options={
                  entityType === 'level'
                    ? levels.map((row) => ({ value: String(row.id), label: `${row.code} — ${row.title}` }))
                    : levelOptions
                }
              />
            </div>

            {entityType !== 'level' ? (
              <div className="materials-cascade-step">
                <label htmlFor="materials-course">Курс</label>
                <Select
                  id="materials-course"
                  value={courseId}
                  onChange={(value) => {
                    setCourseId(value);
                    setUnitId('');
                    setLessonId('');
                  }}
                  placeholder={entityType === 'course' ? '— Оберіть курс —' : undefined}
                  options={
                    entityType === 'course'
                      ? filteredCourses.map((row) => ({
                          value: String(row.id),
                          label: row.level ? `${row.title} (${row.level.code})` : row.title,
                          hint: row.unitCount != null ? `${row.unitCount} юн.` : undefined,
                        }))
                      : [
                          { value: '', label: 'Усі курси' },
                          ...filteredCourses.map((row) => ({
                            value: String(row.id),
                            label: row.title,
                          })),
                        ]
                  }
                />
              </div>
            ) : null}

            {entityType === 'unit' || entityType === 'lesson' ? (
              <div className="materials-cascade-step">
                <label htmlFor="materials-unit">Юніт</label>
                <Select
                  id="materials-unit"
                  value={unitId}
                  onChange={(value) => {
                    setUnitId(value);
                    setLessonId('');
                  }}
                  placeholder={entityType === 'unit' ? '— Оберіть юніт —' : undefined}
                  options={
                    entityType === 'unit'
                      ? filteredUnits.map((row) => ({
                          value: String(row.id),
                          label: row.course ? `${row.title} · ${row.course.title}` : row.title,
                          hint: row.lessonCount != null ? `${row.lessonCount} ур.` : undefined,
                        }))
                      : [
                          { value: '', label: 'Усі юніти' },
                          ...filteredUnits.map((row) => ({
                            value: String(row.id),
                            label: row.title,
                          })),
                        ]
                  }
                />
              </div>
            ) : null}

            {entityType === 'lesson' ? (
              <div className="materials-cascade-step">
                <label htmlFor="materials-lesson">Урок</label>
                <Select
                  id="materials-lesson"
                  value={lessonId}
                  onChange={setLessonId}
                  placeholder="— Оберіть урок —"
                  options={filteredLessons.map((row) => ({
                    value: String(row.id),
                    label: row.unit ? `${row.title} · ${row.unit.title}` : row.title,
                  }))}
                />
              </div>
            ) : null}
          </div>

          <div className="curriculum-access-actions">
            <button className="btn" type="submit" disabled={busy || !selectedEntityId}>
              {busy ? 'Збереження…' : 'Присвоїти'}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="muted">Завантаження…</p>
        ) : grantCards.length ? (
          <div className="materials-grant-list">
            {grantCards.map(({ access, tree }) => (
              <GrantCard key={access.id} access={access} tree={tree} onRevoke={(id) => void onRevoke(id)} />
            ))}
          </div>
        ) : (
          <p className="muted">Поки немає присвоєних матеріалів.</p>
        )}
      </div>
    </div>
  );
}
