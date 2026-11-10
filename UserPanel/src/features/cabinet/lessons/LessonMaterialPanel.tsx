export type LessonPresentation = {
  id: number;
  originalName: string;
  url: string;
  mime: string;
  sizeBytes: number;
};

export function formatPresentationSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function LessonPresentationDownload({
  presentation,
}: {
  presentation: {
    originalName: string;
    url: string;
    sizeBytes: number;
  };
}) {
  return (
    <div className="lesson-presentation-download">
      <div className="lesson-presentation-copy">
        <p className="lesson-material-kicker">Файл</p>
        <strong>{presentation.originalName}</strong>
        <p className="muted">{formatPresentationSize(presentation.sizeBytes)}</p>
      </div>
      <div className="lesson-presentation-actions">
        <a className="btn ghost" href={presentation.url} target="_blank" rel="noreferrer">
          Відкрити
        </a>
        <a className="btn" href={presentation.url} download={presentation.originalName} target="_blank" rel="noreferrer">
          Завантажити
        </a>
      </div>
    </div>
  );
}

export function LessonMaterialPanel({
  title,
  description,
  presentation,
}: {
  title: string;
  description?: string | null;
  presentation?: {
    originalName: string;
    url: string;
    sizeBytes: number;
  } | null;
}) {
  return (
    <section className="dash-box lesson-material-panel">
      <header className="dash-box-head">
        <div>
          <h2>{title}</h2>
          {description ? <p className="muted">{description}</p> : null}
        </div>
      </header>
      <div className="lesson-material-body">
        {presentation ? (
          <LessonPresentationDownload presentation={presentation} />
        ) : (
          <p className="lesson-material-empty">Презентацію для цього уроку ще не додано.</p>
        )}
      </div>
    </section>
  );
}
