'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CabinetBackRow } from '@/features/cabinet/CabinetBackRow';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { LessonMaterialPanel } from '@/features/cabinet/lessons/LessonMaterialPanel';
import { LinkedTestsPanel } from '@/features/tests/LinkedTestsPanel';
import { libraryApi, type LibraryContentDetail } from './api';
import {
  libraryEntityTypeLabel,
  libraryHomePath,
  libraryMaterialPath,
  type LibraryAudience,
  type LibraryEntityType,
} from './paths';

const TYPE_MAP: Record<string, 'level' | 'course' | 'unit' | 'lesson'> = {
  levels: 'level',
  courses: 'course',
  units: 'unit',
  lessons: 'lesson',
};

function modeLabel(mode: 'readonly' | 'fork') {
  return mode === 'readonly' ? 'Лише використання' : 'Форк';
}

function Breadcrumb({
  audience,
  level,
  course,
  unit,
}: {
  audience: LibraryAudience;
  level?: { id: number; code: string; title: string } | null;
  course?: { id: number; title: string } | null;
  unit?: { id: number; title: string } | null;
}) {
  const items: { href: string; label: string }[] = [];
  if (level) {
    items.push({
      href: libraryMaterialPath('levels', level.id, audience),
      label: `${level.code} — ${level.title}`,
    });
  }
  if (course) {
    items.push({ href: libraryMaterialPath('courses', course.id, audience), label: course.title });
  }
  if (unit) {
    items.push({ href: libraryMaterialPath('units', unit.id, audience), label: unit.title });
  }
  if (!items.length) return null;

  return (
    <nav className="library-detail-crumb" aria-label="Шлях до матеріалу">
      {items.map((item, index) => (
        <span key={item.href} className="library-detail-crumb-item">
          {index ? <span className="library-detail-crumb-sep">/</span> : null}
          <Link href={item.href}>{item.label}</Link>
        </span>
      ))}
    </nav>
  );
}

function ChildLinks({
  audience,
  items,
  type,
  countLabel,
}: {
  audience: LibraryAudience;
  items: { id: number; title: string; description?: string | null; unitCount?: number; lessonCount?: number }[];
  type: LibraryEntityType;
  countLabel?: (item: { unitCount?: number; lessonCount?: number }) => string | null;
}) {
  if (!items.length) {
    return <p className="muted">Немає вкладених елементів.</p>;
  }

  return (
    <div className="library-detail-children">
      {items.map((item) => {
        const meta = countLabel?.(item);
        return (
          <Link
            key={item.id}
            href={libraryMaterialPath(type, item.id, audience)}
            className="library-detail-child"
          >
            <span className="library-detail-child-title">{item.title}</span>
            {item.description ? <span className="library-detail-child-desc">{item.description}</span> : null}
            {meta ? <span className="library-detail-child-meta">{meta}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}

export function LibraryMaterialDetailView({
  audience = 'teacher',
}: {
  audience?: LibraryAudience;
}) {
  const params = useParams<{ entityType: string; id: string }>();
  const routeType = params?.entityType ?? '';
  const apiType = TYPE_MAP[routeType];
  const id = Number(params?.id);
  const homeHref = libraryHomePath(audience);
  const homeLabel = audience === 'student' ? 'До матеріалів' : 'До бібліотеки';
  const [detail, setDetail] = useState<LibraryContentDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (!apiType || !Number.isInteger(id) || id < 1) {
      setError('Матеріал не знайдено');
      return;
    }
    setError('');
    libraryApi
      .getContentDetail(apiType, id)
      .then(setDetail)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [apiType, id]);

  async function onFork(lessonId: number) {
    setBusy(true);
    setOk('');
    setError('');
    try {
      await libraryApi.forkLesson(lessonId);
      setOk('Копію створено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося створити копію');
    } finally {
      setBusy(false);
    }
  }

  if (!detail && !error) {
    return (
      <CabinetPage title="Матеріал" lead="Деталі наданого контенту.">
        <CabinetBackRow parentHref={homeHref} parentLabel={homeLabel} />
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  if (error || !detail) {
    return (
      <CabinetPage title="Матеріал" lead="Деталі наданого контенту.">
        <CabinetBackRow parentHref={homeHref} parentLabel={homeLabel} />
        <p className="form-error">{error || 'Матеріал не знайдено'}</p>
      </CabinetPage>
    );
  }

  const title =
    detail.entityType === 'level'
      ? detail.level.title
      : detail.entityType === 'course'
        ? detail.course.title
        : detail.entityType === 'unit'
          ? detail.unit.title
          : detail.lesson.title;

  const description =
    detail.entityType === 'level'
      ? detail.level.description
      : detail.entityType === 'course'
        ? detail.course.description
        : detail.entityType === 'unit'
          ? detail.unit.description
          : detail.lesson.description;

  const canFork = audience === 'teacher' && detail.mode === 'fork';

  return (
    <CabinetPage
      kicker={libraryEntityTypeLabel(routeType as LibraryEntityType)}
      title={title}
      lead={audience === 'teacher' ? `Режим доступу: ${modeLabel(detail.mode)}` : undefined}
    >
      <CabinetBackRow parentHref={homeHref} parentLabel={homeLabel} />

      {ok ? <p className="ok">{ok}</p> : null}

      <div className="dash-box library-detail-box">
        {detail.entityType === 'level' ? (
          <>
            <div className="library-detail-head">
              <span className="library-badge">{detail.level.code}</span>
              {description ? <p className="library-detail-desc">{description}</p> : null}
            </div>
            <h3 className="library-detail-section-title">Курси</h3>
            <ChildLinks
              audience={audience}
              type="courses"
              items={detail.courses}
              countLabel={(item) => (item.unitCount != null ? `${item.unitCount} юн.` : null)}
            />
          </>
        ) : null}

        {detail.entityType === 'course' ? (
          <>
            <Breadcrumb audience={audience} level={detail.level} />
            {description ? <p className="library-detail-desc">{description}</p> : null}
            <h3 className="library-detail-section-title">Юніти</h3>
            <ChildLinks
              audience={audience}
              type="units"
              items={detail.units}
              countLabel={(item) => (item.lessonCount != null ? `${item.lessonCount} ур.` : null)}
            />
          </>
        ) : null}

        {detail.entityType === 'unit' ? (
          <>
            <Breadcrumb audience={audience} level={detail.level} course={detail.course} />
            {description ? <p className="library-detail-desc">{description}</p> : null}
            <h3 className="library-detail-section-title">Уроки</h3>
            <ChildLinks audience={audience} type="lessons" items={detail.lessons} />
          </>
        ) : null}

        {detail.entityType === 'lesson' ? (
          <>
            <Breadcrumb
              audience={audience}
              level={detail.level}
              course={detail.course}
              unit={detail.unit}
            />
            <LessonMaterialPanel
              title={detail.lesson.title}
              description={detail.lesson.description}
              presentation={detail.lesson.presentation}
            />
            <LinkedTestsPanel
              tests={detail.linkedTests ?? []}
              showPassword={audience === 'teacher'}
            />
            {canFork ? (
              <div className="library-detail-actions">
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => void onFork(detail.lesson.id)}
                >
                  {busy ? 'Створення…' : 'Зробити копію'}
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {detail.entityType !== 'lesson' && detail.linkedTests?.length ? (
          <LinkedTestsPanel tests={detail.linkedTests} showPassword={audience === 'teacher'} />
        ) : null}
      </div>
    </CabinetPage>
  );
}
