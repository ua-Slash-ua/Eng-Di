'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CabinetBackRow } from '@/features/cabinet/CabinetBackRow';
import { CabinetPage } from '@/features/cabinet/CabinetPage';
import { LessonPresentationDownload } from '@/features/cabinet/lessons/LessonMaterialPanel';
import { libraryApi, type TeacherOwnLesson } from './api';

type OwnLessonTab = 'general' | 'materials';

export function TeacherOwnLessonEditView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);
  const [tab, setTab] = useState<OwnLessonTab>('general');
  const [item, setItem] = useState<TeacherOwnLesson | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(id) || id < 1) {
      setError('Урок не знайдено');
      return;
    }
    libraryApi
      .getOwnLesson(id)
      .then((data) => {
        setItem(data);
        setTitle(data.title);
        setDescription(data.description ?? '');
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, [id]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!item) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      const updated = await libraryApi.updateLesson(item.id, {
        title,
        description: description || undefined,
      });
      setItem(updated);
      setOk('Збережено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    if (!window.confirm(`Видалити копію «${item.title}»?`)) return;
    setBusy(true);
    setError('');
    try {
      await libraryApi.deleteLesson(item.id);
      router.push('/cabinet/teacher/library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
      setBusy(false);
    }
  }

  if (!item && !error) {
    return (
      <CabinetPage title="Мій урок" lead="Редагування власної копії.">
        <CabinetBackRow parentHref="/cabinet/teacher/library" parentLabel="До бібліотеки" />
        <p className="muted">Завантаження…</p>
      </CabinetPage>
    );
  }

  if (error && !item) {
    return (
      <CabinetPage title="Мій урок" lead="Редагування власної копії.">
        <CabinetBackRow parentHref="/cabinet/teacher/library" parentLabel="До бібліотеки" />
        <p className="form-error">{error}</p>
      </CabinetPage>
    );
  }

  if (!item) return null;

  return (
    <CabinetPage title={item.title} lead={item.sourceLesson ? `Копія: ${item.sourceLesson.title}` : 'Власний урок'}>
      <CabinetBackRow parentHref="/cabinet/teacher/library" parentLabel="До бібліотеки" />

      <div className="dash-box lesson-edit-panel">
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
          >
            Матеріали
            {item.presentation ? <span className="lesson-edit-tab-badge">1</span> : null}
          </button>
        </div>

        <div className="lesson-edit-body">
          {tab === 'general' ? (
            <form className="cabinet-form lesson-edit-form" onSubmit={onSave}>
              {error ? <p className="form-error">{error}</p> : null}
              {ok ? <p className="ok">{ok}</p> : null}
              <label htmlFor="own-lesson-title">Назва</label>
              <input
                id="own-lesson-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={220}
              />
              <label htmlFor="own-lesson-desc">Опис</label>
              <textarea
                id="own-lesson-desc"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                rows={4}
              />
              <div className="lesson-edit-actions">
                <button className="btn" type="submit" disabled={busy}>
                  {busy ? 'Збереження…' : 'Зберегти'}
                </button>
                <button className="btn ghost library-danger" type="button" disabled={busy} onClick={() => void onDelete()}>
                  Видалити
                </button>
              </div>
            </form>
          ) : null}

          {tab === 'materials' ? (
            <div className="lesson-edit-form">
              {item.presentation ? (
                <LessonPresentationDownload presentation={item.presentation} />
              ) : (
                <p className="muted">У цій копії немає презентації.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </CabinetPage>
  );
}
