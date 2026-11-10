export function CabinetPage({
  kicker = 'Кабінет',
  title,
  lead,
  wide = false,
  children,
}: {
  kicker?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  wide?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className={`cabinet-page${wide ? ' is-wide' : ''}`}>
      <header className="cabinet-head">
        <p className="cabinet-kicker">{kicker}</p>
        <h1>{title}</h1>
        {lead ? <p className="lead">{lead}</p> : null}
      </header>
      {children}
    </section>
  );
}
