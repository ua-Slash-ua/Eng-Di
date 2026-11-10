export type MetaBarItem = {
  label: string;
  value: string;
};

export function MetaBar({ items }: { items: MetaBarItem[] }) {
  return (
    <div className="meta-bar">
      {items.map((item) => (
        <span className="meta-chip" key={item.label}>
          <span>{item.label}</span>
          <b>{item.value}</b>
        </span>
      ))}
    </div>
  );
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
