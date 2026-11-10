'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormAlerts, LoadingState } from '@/components/ui/FormAlerts';
import { PageHead } from '@/components/ui/PageHead';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useTableQuery } from '@/hooks/useTableQuery';
import { curriculumApi } from '../api';
import type { ContentCourse, ContentLesson, ContentLevel, ContentUnit } from '../types';

export type CurriculumKind = 'lessons' | 'units' | 'courses' | 'levels';

const FREE_OPTIONS = [
  { value: 'yes', label: 'Так' },
  { value: 'no', label: 'Ні' },
];

const META: Record<CurriculumKind, { title: string; description: string; createPath: string; basePath: string }> = {
  lessons: {
    title: 'Уроки',
    description: 'Контент-уроки платформи.',
    createPath: '/materials/lessons/new',
    basePath: '/materials/lessons',
  },
  units: {
    title: 'Юніти',
    description: 'Юніти курсів і вільні юніти.',
    createPath: '/materials/units/new',
    basePath: '/materials/units',
  },
  courses: {
    title: 'Курси',
    description: 'Курси за рівнями та вільні курси.',
    createPath: '/materials/courses/new',
    basePath: '/materials/courses',
  },
  levels: {
    title: 'Рівні',
    description: 'Рівні навчального контенту (A1, A2…).',
    createPath: '/materials/levels/new',
    basePath: '/materials/levels',
  },
};

function yesNo(value: boolean) {
  return value ? (
    <span className="status-pill status-review">Так</span>
  ) : (
    <span className="status-pill status-active">Ні</span>
  );
}

function CurriculumViewInner({ kind }: { kind: CurriculumKind }) {
  const router = useRouter();
  const meta = META[kind];
  const [levels, setLevels] = useState<ContentLevel[]>([]);
  const [courses, setCourses] = useState<ContentCourse[]>([]);
  const [units, setUnits] = useState<ContentUnit[]>([]);
  const [lessons, setLessons] = useState<ContentLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filterKeys =
    kind === 'lessons'
      ? (['title', 'unit', 'course', 'free'] as const)
      : kind === 'units'
        ? (['title', 'course', 'free'] as const)
        : kind === 'courses'
          ? (['title', 'level', 'free'] as const)
          : (['title', 'code'] as const);

  const tableQuery = useTableQuery(meta.basePath, filterKeys);

  useEffect(() => {
    setLoading(true);
    setError('');
    const load =
      kind === 'lessons'
        ? curriculumApi.listLessons().then(setLessons)
        : kind === 'units'
          ? curriculumApi.listUnits().then(setUnits)
          : kind === 'courses'
            ? curriculumApi.listCourses().then(setCourses)
            : curriculumApi.listLevels().then(setLevels);

    load
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'))
      .finally(() => setLoading(false));
  }, [kind]);

  const filteredLessons = useMemo(() => {
    const title = tableQuery.filters.title?.trim().toLowerCase() ?? '';
    const unit = tableQuery.filters.unit?.trim().toLowerCase() ?? '';
    const course = tableQuery.filters.course?.trim().toLowerCase() ?? '';
    const free = tableQuery.filters.free;
    return lessons.filter((item) => {
      if (title && !item.title.toLowerCase().includes(title)) return false;
      if (unit && !(item.unit?.title ?? '').toLowerCase().includes(unit)) return false;
      if (course && !(item.unit?.course?.title ?? '').toLowerCase().includes(course)) return false;
      if (free === 'yes' && !item.isFree) return false;
      if (free === 'no' && item.isFree) return false;
      return true;
    });
  }, [lessons, tableQuery.filters]);

  const filteredUnits = useMemo(() => {
    const title = tableQuery.filters.title?.trim().toLowerCase() ?? '';
    const course = tableQuery.filters.course?.trim().toLowerCase() ?? '';
    const free = tableQuery.filters.free;
    return units.filter((item) => {
      if (title && !item.title.toLowerCase().includes(title)) return false;
      if (course && !(item.course?.title ?? '').toLowerCase().includes(course)) return false;
      if (free === 'yes' && !item.isFree) return false;
      if (free === 'no' && item.isFree) return false;
      return true;
    });
  }, [units, tableQuery.filters]);

  const filteredCourses = useMemo(() => {
    const title = tableQuery.filters.title?.trim().toLowerCase() ?? '';
    const level = tableQuery.filters.level?.trim().toLowerCase() ?? '';
    const free = tableQuery.filters.free;
    return courses.filter((item) => {
      if (title && !item.title.toLowerCase().includes(title)) return false;
      if (
        level &&
        !(`${item.level?.code ?? ''} ${item.level?.title ?? ''}`.toLowerCase().includes(level))
      ) {
        return false;
      }
      if (free === 'yes' && !item.isFree) return false;
      if (free === 'no' && item.isFree) return false;
      return true;
    });
  }, [courses, tableQuery.filters]);

  const filteredLevels = useMemo(() => {
    const title = tableQuery.filters.title?.trim().toLowerCase() ?? '';
    const code = tableQuery.filters.code?.trim().toLowerCase() ?? '';
    return levels.filter((item) => {
      if (title && !item.title.toLowerCase().includes(title)) return false;
      if (code && !item.code.toLowerCase().includes(code)) return false;
      return true;
    });
  }, [levels, tableQuery.filters]);

  const lessonColumns = useMemo<Column<ContentLesson>[]>(
    () => [
      {
        key: 'title',
        header: 'Назва',
        filter: { type: 'text', param: 'title', placeholder: 'Назва…' },
        render: (item) => (
          <>
            <div className="student-name">{item.title}</div>
            {item.description ? <div className="student-email">{item.description}</div> : null}
          </>
        ),
      },
      {
        key: 'unit',
        header: 'Юніт',
        filter: { type: 'text', param: 'unit', placeholder: 'Юніт…' },
        render: (item) => item.unit?.title ?? <span className="muted">—</span>,
      },
      {
        key: 'course',
        header: 'Курс',
        filter: { type: 'text', param: 'course', placeholder: 'Курс…' },
        render: (item) => item.unit?.course?.title ?? <span className="muted">—</span>,
      },
      {
        key: 'free',
        header: 'Вільний',
        width: '8.3333vw',
        filter: { type: 'select', param: 'free', options: FREE_OPTIONS, placeholder: 'Усі' },
        render: (item) => yesNo(Boolean(item.isFree)),
      },
      {
        key: 'updatedAt',
        header: 'Оновлено',
        width: '11.1111vw',
        render: (item) => new Date(item.updatedAt).toLocaleDateString('uk-UA'),
      },
    ],
    [],
  );

  const unitColumns = useMemo<Column<ContentUnit>[]>(
    () => [
      {
        key: 'title',
        header: 'Назва',
        filter: { type: 'text', param: 'title', placeholder: 'Назва…' },
        render: (item) => (
          <>
            <div className="student-name">{item.title}</div>
            {item.description ? <div className="student-email">{item.description}</div> : null}
          </>
        ),
      },
      {
        key: 'course',
        header: 'Курс',
        filter: { type: 'text', param: 'course', placeholder: 'Курс…' },
        render: (item) => item.course?.title ?? <span className="muted">—</span>,
      },
      {
        key: 'free',
        header: 'Вільний',
        width: '8.3333vw',
        filter: { type: 'select', param: 'free', options: FREE_OPTIONS, placeholder: 'Усі' },
        render: (item) => yesNo(Boolean(item.isFree)),
      },
      {
        key: 'lessons',
        header: 'Уроків',
        width: '8.3333vw',
        render: (item) => item.lessonCount ?? item.lessons?.length ?? 0,
      },
      {
        key: 'updatedAt',
        header: 'Оновлено',
        width: '11.1111vw',
        render: (item) => new Date(item.updatedAt).toLocaleDateString('uk-UA'),
      },
    ],
    [],
  );

  const courseColumns = useMemo<Column<ContentCourse>[]>(
    () => [
      {
        key: 'title',
        header: 'Назва',
        filter: { type: 'text', param: 'title', placeholder: 'Назва…' },
        render: (item) => (
          <>
            <div className="student-name">{item.title}</div>
            {item.description ? <div className="student-email">{item.description}</div> : null}
          </>
        ),
      },
      {
        key: 'level',
        header: 'Рівень',
        width: '9.7222vw',
        filter: { type: 'text', param: 'level', placeholder: 'Рівень…' },
        render: (item) =>
          item.level ? (
            <span className="status-pill status-active">{item.level.code}</span>
          ) : (
            <span className="muted">—</span>
          ),
      },
      {
        key: 'free',
        header: 'Вільний',
        width: '8.3333vw',
        filter: { type: 'select', param: 'free', options: FREE_OPTIONS, placeholder: 'Усі' },
        render: (item) => yesNo(Boolean(item.isFree)),
      },
      {
        key: 'counts',
        header: 'Юніти / уроки',
        width: '11.1111vw',
        render: (item) => `${item.unitCount ?? item.units?.length ?? 0} / ${item.lessonCount ?? 0}`,
      },
      {
        key: 'updatedAt',
        header: 'Оновлено',
        width: '11.1111vw',
        render: (item) => new Date(item.updatedAt).toLocaleDateString('uk-UA'),
      },
    ],
    [],
  );

  const levelColumns = useMemo<Column<ContentLevel>[]>(
    () => [
      {
        key: 'code',
        header: 'Код',
        width: '8.3333vw',
        filter: { type: 'text', param: 'code', placeholder: 'Код…' },
        render: (item) => <span className="status-pill status-active">{item.code}</span>,
      },
      {
        key: 'title',
        header: 'Назва',
        filter: { type: 'text', param: 'title', placeholder: 'Назва…' },
        render: (item) => (
          <>
            <div className="student-name">{item.title}</div>
            {item.description ? <div className="student-email">{item.description}</div> : null}
          </>
        ),
      },
      {
        key: 'courses',
        header: 'Курсів',
        width: '8.3333vw',
        render: (item) => item.courses?.length ?? 0,
      },
      {
        key: 'updatedAt',
        header: 'Оновлено',
        width: '11.1111vw',
        render: (item) => new Date(item.updatedAt).toLocaleDateString('uk-UA'),
      },
    ],
    [],
  );

  return (
    <>
      <PageHead
        title={meta.title}
        description={meta.description}
        actions={
          <button className="btn" type="button" onClick={() => router.push(meta.createPath)}>
            + Створити
          </button>
        }
      />

      <FormAlerts error={error} />
      {loading ? (
        <LoadingState />
      ) : kind === 'lessons' ? (
        <DataTable
          columns={lessonColumns}
          items={filteredLessons}
          rowKey={(item) => item.id}
          onRowClick={(item) => router.push(`/materials/lessons/${item.id}`)}
          emptyText="Уроків не знайдено"
          columnFilters={{ values: tableQuery.filters, onChange: tableQuery.setFilter }}
          onReset={tableQuery.reset}
          hasActiveFilters={tableQuery.hasActiveFilters}
        />
      ) : kind === 'units' ? (
        <DataTable
          columns={unitColumns}
          items={filteredUnits}
          rowKey={(item) => item.id}
          onRowClick={(item) => router.push(`/materials/units/${item.id}`)}
          emptyText="Юнітів не знайдено"
          columnFilters={{ values: tableQuery.filters, onChange: tableQuery.setFilter }}
          onReset={tableQuery.reset}
          hasActiveFilters={tableQuery.hasActiveFilters}
        />
      ) : kind === 'courses' ? (
        <DataTable
          columns={courseColumns}
          items={filteredCourses}
          rowKey={(item) => item.id}
          onRowClick={(item) => router.push(`/materials/courses/${item.id}`)}
          emptyText="Курсів не знайдено"
          columnFilters={{ values: tableQuery.filters, onChange: tableQuery.setFilter }}
          onReset={tableQuery.reset}
          hasActiveFilters={tableQuery.hasActiveFilters}
        />
      ) : (
        <DataTable
          columns={levelColumns}
          items={filteredLevels}
          rowKey={(item) => item.id}
          onRowClick={(item) => router.push(`/materials/levels/${item.id}`)}
          emptyText="Рівнів не знайдено"
          columnFilters={{ values: tableQuery.filters, onChange: tableQuery.setFilter }}
          onReset={tableQuery.reset}
          hasActiveFilters={tableQuery.hasActiveFilters}
        />
      )}
    </>
  );
}

export function CurriculumView({ kind }: { kind: CurriculumKind }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <CurriculumViewInner kind={kind} />
    </Suspense>
  );
}
