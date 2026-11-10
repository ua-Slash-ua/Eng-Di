type PagerProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

export function Pager({ page, pageCount, onChange }: PagerProps) {
  if (pageCount <= 1) {
    return null;
  }
  return (
    <div className="pager">
      <button className="btn-outline" type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Назад
      </button>
      <span className="muted">
        {page} / {pageCount}
      </span>
      <button className="btn-outline" type="button" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        Далі
      </button>
    </div>
  );
}
