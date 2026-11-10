import Link from 'next/link';

export function LoadingState({ text = 'Завантаження…' }: { text?: string }) {
  return <p className="muted">{text}</p>;
}

export function LoadError({ message, href, hrefLabel = 'До списку' }: { message: string; href?: string; hrefLabel?: string }) {
  return (
    <>
      <p className="error">{message}</p>
      {href ? (
        <Link href={href} className="btn-outline">
          {hrefLabel}
        </Link>
      ) : null}
    </>
  );
}

export function FormAlerts({ error, ok, warning }: { error?: string; ok?: string; warning?: string }) {
  return (
    <>
      {error ? <p className="error">{error}</p> : null}
      {warning ? <p className="warn">{warning}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
    </>
  );
}
