'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { GrantedTestsList } from './GrantedTestsList';
import {
  libraryApi,
  type ContentCourseBrief,
  type ContentLessonBrief,
  type ContentLevelBrief,
  type ContentUnitBrief,
  type GrantedFreeTest,
  type LibraryResponse,
} from './api';
import { libraryMaterialPath } from './paths';

type Tab = 'levels' | 'courses' | 'units' | 'lessons' | 'tests';

export function StudentMaterialsView() {
  const [library, setLibrary] = useState<LibraryResponse | null>(null);
  const [tests, setTests] = useState<GrantedFreeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab | null>(null);

  useEffect(() => {
    Promise.all([libraryApi.getLibrary(), libraryApi.getGrantedTests()])
      .then(([lib, grantedTests]) => {
        setLibrary(lib);
        setTests(grantedTests);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'))
      .finally(() => setLoading(false));
  }, []);

  const tabs = useMemo(() => {
    if (!library) return [] as { id: Tab; label: string; count: number }[];
    const items: { id: Tab; label: string; count: number }[] = [];
    if (library.grantedLevels.length) {
      items.push({ id: 'levels', label: 'Рівні', count: library.grantedLevels.length });
    }
    if (library.grantedCourses.length) {
      items.push({ id: 'courses', label: 'Курси', count: library.grantedCourses.length });
    }
    if (library.grantedUnits.length) {
      items.push({ id: 'units', label: 'Юніти', count: library.grantedUnits.length });
    }
    if (library.grantedLessons.length) {
      items.push({ id: 'lessons', label: 'Уроки', count: library.grantedLessons.length });
    }
    if (tests.length) {
      items.push({ id: 'tests', label: 'Тести', count: tests.length });
    }
    return items;
  }, [library, tests]);

  useEffect(() => {
    if (!tabs.length) {
      setTab(null);
      return;
    }
    setTab((prev) => (prev && tabs.some((item) => item.id === prev) ? prev : tabs[0].id));
  }, [tabs]);

  const emptyAll = !loading && !error && tabs.length === 0;

  return (
    <CabinetPage
      title="Матеріали"
      lead="Контент, до якого вам відкрив доступ адміністратор"
    >
      {loading ? <p className="muted">Завантаження…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {emptyAll ? (
        <div className="dash-box library-empty">
          <div className="library-empty-body">
            <p>Поки немає доступу до жодного матеріалу.</p>
            <p className="muted">
              Коли адміністратор присвоїть вам рівні, курси, юніти, уроки або тести — вони з’являться тут.
            </p>
          </div>
        </div>
      ) : null}

      {!loading && !error && tabs.length > 0 ? (
        <>
          <div
            className="cabinet-tabs library-tabs student-materials-tabs"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            role="tablist"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={tab === item.id ? 'active' : undefined}
                onClick={() => setTab(item.id)}
              >
                <span>
                  {item.label} ({item.count})
                </span>
              </button>
            ))}
          </div>

          {tab === 'levels' && library ? <LevelsList levels={library.grantedLevels} /> : null}
          {tab === 'courses' && library ? <CoursesList courses={library.grantedCourses} /> : null}
          {tab === 'units' && library ? <UnitsList units={library.grantedUnits} /> : null}
          {tab === 'lessons' && library ? <LessonsList lessons={library.grantedLessons} /> : null}
          {tab === 'tests' ? <GrantedTestsList tests={tests} /> : null}
        </>
      ) : null}
    </CabinetPage>
  );
}

function LevelsList({ levels }: { levels: ContentLevelBrief[] }) {
  return (
    <div className="library-own-list">
      {levels.map((level) => (
        <Link
          key={level.id}
          href={libraryMaterialPath('levels', level.id, 'student')}
          className="dash-box library-own-card library-item-link"
        >
          <div className="library-lesson-title">
            {level.code} — {level.title}
          </div>
          <div className="library-lesson-desc muted">{level.courses.length} курсів</div>
        </Link>
      ))}
    </div>
  );
}

function CoursesList({ courses }: { courses: ContentCourseBrief[] }) {
  return (
    <div className="library-own-list">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={libraryMaterialPath('courses', course.id, 'student')}
          className="dash-box library-own-card library-item-link"
        >
          <div className="library-lesson-title">{course.title}</div>
          <div className="library-lesson-desc muted">{course.units.length} юнітів</div>
        </Link>
      ))}
    </div>
  );
}

function UnitsList({ units }: { units: ContentUnitBrief[] }) {
  return (
    <div className="library-own-list">
      {units.map((unit) => (
        <Link
          key={unit.id}
          href={libraryMaterialPath('units', unit.id, 'student')}
          className="dash-box library-own-card library-item-link"
        >
          <div className="library-lesson-title">{unit.title}</div>
          {unit.description ? <div className="library-lesson-desc">{unit.description}</div> : null}
          <div className="library-lesson-desc muted">{unit.lessons.length} уроків</div>
        </Link>
      ))}
    </div>
  );
}

function LessonsList({ lessons }: { lessons: ContentLessonBrief[] }) {
  return (
    <div className="library-own-list">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="dash-box library-own-card">
          <Link
            href={libraryMaterialPath('lessons', lesson.id, 'student')}
            className="library-lesson-link"
          >
            <div className="library-lesson-title">{lesson.title}</div>
            {lesson.description ? <div className="library-lesson-desc">{lesson.description}</div> : null}
          </Link>
          <Link
            href={libraryMaterialPath('lessons', lesson.id, 'student')}
            className="btn ghost library-lesson-action"
          >
            Відкрити
          </Link>
        </div>
      ))}
    </div>
  );
}
