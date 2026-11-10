'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NewBadge } from '@/components/NewBadge';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { GrantedTestsList } from './GrantedTestsList';
import { libraryApi, type GrantedFreeTest } from './api';
import { libraryMaterialPath, libraryOwnLessonPath } from './paths';
import type {
  ContentLessonBrief,
  ContentUnitBrief,
  LibraryResponse,
  TeacherOwnLesson,
  TeacherUnitItem,
} from './api';

type Tab = 'granted' | 'own-lessons' | 'own-units' | 'tests';

export function TeacherLibraryView() {
  const [tab, setTab] = useState<Tab>('granted');
  const [library, setLibrary] = useState<LibraryResponse | null>(null);
  const [tests, setTests] = useState<GrantedFreeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([libraryApi.getLibrary(), libraryApi.getGrantedTests()])
      .then(([lib, grantedTests]) => {
        setLibrary(lib);
        setTests(grantedTests);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'))
      .finally(() => setLoading(false));
  }, []);

  function openTab(next: Tab) {
    setTab(next);
  }

  async function onFork(lesson: ContentLessonBrief) {
    try {
      const forked = await libraryApi.forkLesson(lesson.id);
      setLibrary((prev) => (prev ? { ...prev, ownLessons: [forked, ...prev.ownLessons] } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Помилка');
    }
  }

  async function onDeleteOwnLesson(id: number) {
    if (!window.confirm('Видалити цей урок?')) return;
    try {
      await libraryApi.deleteLesson(id);
      setLibrary((prev) =>
        prev ? { ...prev, ownLessons: prev.ownLessons.filter((l) => l.id !== id) } : prev,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Помилка');
    }
  }

  if (loading) {
    return (
      <CabinetPage title="Бібліотека матеріалів" lead="Контент, до якого вам відкрив доступ адміністратор.">
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  if (error) {
    return (
      <CabinetPage title="Бібліотека матеріалів" lead="Контент, до якого вам відкрив доступ адміністратор.">
        <p className="form-error">{error}</p>
      </CabinetPage>
    );
  }

  if (!library) return null;

  const totalGranted =
    library.grantedLevels.length +
    library.grantedCourses.length +
    library.grantedUnits.length +
    library.grantedLessons.length;

  return (
    <CabinetPage title="Бібліотека матеріалів" lead="Контент, до якого вам відкрив доступ адміністратор.">
      <div className="cabinet-tabs library-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'granted'}
          className={tab === 'granted' ? 'active' : undefined}
          onClick={() => openTab('granted')}
        >
          Надані ({totalGranted})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'own-lessons'}
          className={tab === 'own-lessons' ? 'active' : undefined}
          onClick={() => openTab('own-lessons')}
        >
          Мої уроки ({library.ownLessons.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'own-units'}
          className={tab === 'own-units' ? 'active' : undefined}
          onClick={() => openTab('own-units')}
        >
          Мої юніти ({library.ownUnits.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tests'}
          className={`cabinet-tab-with-new${tab === 'tests' ? ' active' : ''}`}
          onClick={() => openTab('tests')}
        >
          <span>Тести ({tests.length})</span>
          <NewBadge />
        </button>
      </div>

      {tab === 'granted' && <GrantedContent library={library} onFork={onFork} />}
      {tab === 'own-lessons' && (
        <OwnLessonsList lessons={library.ownLessons} onDelete={onDeleteOwnLesson} />
      )}
      {tab === 'own-units' && <OwnUnitsList units={library.ownUnits} />}
      {tab === 'tests' && <GrantedTestsList tests={tests} />}
    </CabinetPage>
  );
}

function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-box library-empty">
      <div className="library-empty-body">{children}</div>
    </div>
  );
}

function GrantedContent({
  library,
  onFork,
}: {
  library: LibraryResponse;
  onFork: (lesson: ContentLessonBrief) => void;
}) {
  const total =
    library.grantedLevels.length +
    library.grantedCourses.length +
    library.grantedUnits.length +
    library.grantedLessons.length;

  if (!total) {
    return (
      <EmptyBox>
        <p className="muted">Адміністратор ще не надав вам доступ до матеріалів.</p>
      </EmptyBox>
    );
  }

  return (
    <div className="library-granted">
      {library.grantedLevels.map((level) => (
        <div key={level.id} className="dash-box library-section">
          <div className="library-section-head">
            <span className="library-badge">{level.code}</span>
            <Link href={libraryMaterialPath('levels', level.id)} className="library-item-link">
              <strong>{level.title}</strong>
            </Link>
          </div>
          {level.courses.map((course) => (
            <div key={course.id} className="library-course">
              <Link href={libraryMaterialPath('courses', course.id)} className="library-course-title library-item-link">
                {course.title}
              </Link>
              {course.units.map((unit) => (
                <UnitLessonList key={unit.id} unit={unit} onFork={onFork} />
              ))}
            </div>
          ))}
        </div>
      ))}

      {library.grantedCourses.map((course) => (
        <div key={course.id} className="dash-box library-section">
          <div className="library-section-head">
            <Link href={libraryMaterialPath('courses', course.id)} className="library-item-link">
              <strong>{course.title}</strong>
            </Link>
          </div>
          {course.units.map((unit) => (
            <UnitLessonList key={unit.id} unit={unit} onFork={onFork} />
          ))}
        </div>
      ))}

      {library.grantedUnits.map((unit) => (
        <div key={unit.id} className="dash-box library-section">
          <UnitLessonList unit={unit} onFork={onFork} />
        </div>
      ))}

      {library.grantedLessons.length > 0 && (
        <div className="dash-box library-section">
          <div className="library-section-head">
            <strong>Окремі уроки</strong>
          </div>
          <div className="library-lesson-list">
            {library.grantedLessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} onFork={onFork} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UnitLessonList({
  unit,
  onFork,
}: {
  unit: ContentUnitBrief;
  onFork: (lesson: ContentLessonBrief) => void;
}) {
  return (
    <div className="library-unit">
      <Link href={libraryMaterialPath('units', unit.id)} className="library-unit-title library-item-link">
        {unit.title}
      </Link>
      <div className="library-lesson-list">
        {unit.lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} onFork={onFork} />
        ))}
      </div>
    </div>
  );
}

function LessonCard({
  lesson,
  onFork,
}: {
  lesson: ContentLessonBrief;
  onFork: (lesson: ContentLessonBrief) => void;
}) {
  return (
    <div className="library-lesson-card">
      <Link href={libraryMaterialPath('lessons', lesson.id)} className="library-lesson-link">
        <div className="library-lesson-title">{lesson.title}</div>
        {lesson.description ? <div className="library-lesson-desc">{lesson.description}</div> : null}
      </Link>
      <button
        type="button"
        className="btn ghost library-lesson-action"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onFork(lesson);
        }}
      >
        Зробити копію
      </button>
    </div>
  );
}

function OwnLessonsList({
  lessons,
  onDelete,
}: {
  lessons: TeacherOwnLesson[];
  onDelete: (id: number) => void;
}) {
  if (!lessons.length) {
    return (
      <EmptyBox>
        <p className="muted">Ви ще не створили жодної власної копії уроку.</p>
        <p className="muted">Перейдіть на вкладку «Надані», щоб зробити копію.</p>
      </EmptyBox>
    );
  }

  return (
    <div className="library-own-list">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="dash-box library-own-card">
          <Link href={libraryOwnLessonPath(lesson.id)} className="library-lesson-link">
            <div className="library-lesson-title">{lesson.title}</div>
            {lesson.sourceLesson ? (
              <div className="muted">Копія: {lesson.sourceLesson.title}</div>
            ) : null}
            {lesson.description ? <div className="library-lesson-desc">{lesson.description}</div> : null}
          </Link>
          <button
            type="button"
            className="btn ghost library-danger"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete(lesson.id);
            }}
          >
            Видалити
          </button>
        </div>
      ))}
    </div>
  );
}

function OwnUnitsList({ units }: { units: TeacherUnitItem[] }) {
  if (!units.length) {
    return (
      <EmptyBox>
        <p className="muted">Ви ще не створили жодного власного юніта.</p>
      </EmptyBox>
    );
  }

  return (
    <div className="library-own-list">
      {units.map((unit) => (
        <div key={unit.id} className="dash-box library-own-card is-unit">
          <div className="library-unit-title">{unit.title}</div>
          <div className="muted">
            {unit.mode === 'readonly' ? 'Лише використання' : 'Редагований'} · {unit.lessons.length} уроків
          </div>
          <div className="library-lesson-list">
            {unit.lessons.map((item) => (
              <div key={item.id} className="library-lesson-card">
                <div className="library-lesson-title">{item.lesson.title}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
