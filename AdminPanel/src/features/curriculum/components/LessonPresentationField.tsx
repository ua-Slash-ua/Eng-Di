'use client';

import { useEffect, useRef, useState } from 'react';
import { settingsApi, type PresentationSettings } from '@/features/settings/api';
import type { LessonPresentation } from '../types';
import { curriculumApi } from '../api';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function fileKindLabel(mime: string, name: string) {
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (mime.includes('presentationml') || name.endsWith('.pptx')) return 'PPTX';
  if (mime.includes('ms-powerpoint') || name.endsWith('.ppt')) return 'PPT';
  if (mime.includes('opendocument.presentation') || name.endsWith('.odp')) return 'ODP';
  if (name.endsWith('.key')) return 'KEY';
  return 'FILE';
}

export function LessonPresentationField({
  lessonId,
  presentation,
  onChange,
}: {
  lessonId: number;
  presentation: LessonPresentation | null;
  onChange: (next: LessonPresentation | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<PresentationSettings | null>(null);
  const [accept, setAccept] = useState('.pdf,.ppt,.pptx,.odp,.key');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    settingsApi
      .getPresentations()
      .then((payload) => {
        setSettings(payload.settings);
        setAccept(payload.accept);
      })
      .catch(() => {});
  }, []);

  async function onPick(file: File | null) {
    if (!file) return;
    if (settings && file.size > settings.maxMb * 1024 * 1024) {
      setError(`Файл перевищує ${settings.maxMb} МБ`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const uploaded = await curriculumApi.uploadLessonPresentation(lessonId, file);
      onChange(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити');
    } finally {
      setBusy(false);
      setDragOver(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    if (!window.confirm('Видалити презентацію?')) return;
    setBusy(true);
    setError('');
    try {
      await curriculumApi.removeLessonPresentation(lessonId);
      onChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося видалити');
    } finally {
      setBusy(false);
    }
  }

  const formatLabels =
    settings?.formats.map((id) => id.toUpperCase()).join(' · ') ?? 'PDF · PPTX · PPT · ODP';

  return (
    <div className="lesson-presentation-field">
      <div className="lesson-presentation-intro">
        <p className="lesson-presentation-lead">
          Завантажте презентацію у вихідному форматі — конвертація не виконується.
        </p>
        <div className="lesson-presentation-meta">
          <span className="lesson-presentation-chip">{formatLabels}</span>
          {settings ? <span className="lesson-presentation-chip">до {settings.maxMb} МБ</span> : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => void onPick(event.target.files?.[0] ?? null)}
      />

      {error ? <p className="form-error">{error}</p> : null}

      {presentation ? (
        <div className="lesson-presentation-file">
          <div className="lesson-presentation-file-icon" aria-hidden="true">
            {fileKindLabel(presentation.mime, presentation.originalName)}
          </div>
          <div className="lesson-presentation-file-main">
            <strong>{presentation.originalName}</strong>
            <p className="muted">{formatBytes(presentation.sizeBytes)}</p>
          </div>
          <div className="lesson-presentation-file-actions">
            <a className="btn ghost" href={presentation.url} target="_blank" rel="noreferrer">
              Відкрити
            </a>
            <button
              type="button"
              className="btn ghost"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Замінити
            </button>
            <button type="button" className="btn ghost lesson-presentation-danger" disabled={busy} onClick={() => void onRemove()}>
              Видалити
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`lesson-presentation-drop${dragOver ? ' is-dragover' : ''}${busy ? ' is-busy' : ''}`}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            void onPick(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <span className="lesson-presentation-drop-icon" aria-hidden="true">
            ↑
          </span>
          <span className="lesson-presentation-drop-title">
            {busy ? 'Завантаження…' : 'Перетягніть файл або натисніть для вибору'}
          </span>
          <span className="lesson-presentation-drop-hint">Презентація ще не додана</span>
        </button>
      )}
    </div>
  );
}
