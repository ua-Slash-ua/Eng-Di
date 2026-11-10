'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { libraryApi } from '@/features/cabinet/library/api';
import { MenuSelect } from '@/features/cabinet/schedule/TimeSelect';
import type { LessonMaterial, LessonStatus } from './api';
import { LessonPresentationDownload } from './LessonMaterialPanel';

export function canAssignLessonMaterial(status: LessonStatus) {
  return (
    status === 'unscheduled' ||
    status === 'proposed' ||
    status === 'confirmed' ||
    status === 'rescheduling'
  );
}

type MaterialOption = {
  key: string;
  label: string;
  hint?: string;
  group: 'content' | 'own';
};

function buildOptions(
  content: { id: number; title: string; unit?: { title: string } | null }[],
  own: { id: number; title: string; sourceLesson?: { title: string } | null }[],
): MaterialOption[] {
  const out: MaterialOption[] = [];
  for (const lesson of content) {
    out.push({
      key: `content:${lesson.id}`,
      label: lesson.title,
      hint: lesson.unit?.title ? `Юніт · ${lesson.unit.title}` : 'Бібліотека',
      group: 'content',
    });
  }
  for (const lesson of own) {
    out.push({
      key: `own:${lesson.id}`,
      label: lesson.title,
      hint: lesson.sourceLesson ? `Копія · ${lesson.sourceLesson.title}` : 'Мій урок',
      group: 'own',
    });
  }
  return out;
}

export function LessonMaterialAssignPanel({
  lessonId,
  material,
  onUpdated,
  disabled,
}: {
  lessonId: number;
  material: LessonMaterial | null;
  onUpdated: () => Promise<void>;
  disabled?: boolean;
}) {
  const [options, setOptions] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pick, setPick] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    libraryApi
      .getLibrary()
      .then((lib) => {
        setOptions(buildOptions(lib.grantedLessons, lib.ownLessons));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити бібліотеку');
      })
      .finally(() => setLoading(false));
  }, []);

  const menuOptions = useMemo(
    () => [
      { value: '', label: loading ? 'Завантаження…' : '— Оберіть урок —' },
      ...options.map((option) => ({
        value: option.key,
        label: option.hint ? `${option.label} · ${option.hint}` : option.label,
      })),
    ],
    [loading, options],
  );

  async function assign(key = pick) {
    if (!key) return;
    const [kind, rawId] = key.split(':');
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) return;

    setError('');
    setBusy(true);
    try {
      if (kind === 'content') {
        await libraryApi.assignContent(lessonId, id, null);
      } else {
        await libraryApi.assignContent(lessonId, null, id);
      }
      setPick('');
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося призначити матеріал');
    } finally {
      setBusy(false);
    }
  }

  async function clearMaterial() {
    setError('');
    setBusy(true);
    try {
      await libraryApi.assignContent(lessonId, null, null);
      setPick('');
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося прибрати матеріал');
    } finally {
      setBusy(false);
    }
  }

  const locked = disabled || busy || loading || !options.length;

  return (
    <section className="dash-box lesson-material-panel">
      <header className="dash-box-head">
        <div>
          <h2>Матеріал заняття</h2>
          <p className="muted">Призначте до підтвердження часу — учень побачить після узгодження.</p>
        </div>
      </header>

      <div className="lesson-material-body">
        {material ? (
          <div className="lesson-material-current">
            <div className="lesson-material-current-copy">
              <p className="lesson-material-kicker">Призначено</p>
              <strong>{material.title}</strong>
              {material.description ? <p className="muted">{material.description}</p> : null}
            </div>
            {material.presentation ? <LessonPresentationDownload presentation={material.presentation} /> : null}
          </div>
        ) : (
          <p className="lesson-material-empty">Матеріал ще не призначено.</p>
        )}

        {error ? <p className="error">{error}</p> : null}

        <div className="lesson-material-assign">
          <label className="lesson-material-assign-label" htmlFor={`lesson-material-${lessonId}`}>
            {material ? 'Змінити матеріал' : 'Обрати з бібліотеки'}
          </label>
          <MenuSelect
            value={pick}
            options={menuOptions}
            onChange={setPick}
            disabled={locked}
            ariaLabel="Урок з бібліотеки"
            variant="field"
          />
          <div className="lesson-material-actions">
            <button className="btn" type="button" disabled={locked || !pick} onClick={() => void assign()}>
              {busy ? 'Збереження…' : material ? 'Змінити' : 'Призначити'}
            </button>
            {material ? (
              <button className="btn ghost" type="button" disabled={disabled || busy} onClick={() => void clearMaterial()}>
                Прибрати
              </button>
            ) : null}
          </div>
          {!loading && !options.length ? (
            <p className="muted lesson-material-footnote">
              У бібліотеці поки немає уроків.{' '}
              <Link href="/cabinet/teacher/library">Відкрити бібліотеку</Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
