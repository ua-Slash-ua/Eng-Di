import type { ReactNode } from 'react';

type Props = {
  id?: string;
  className?: string;
  wrapClassName?: string;
  children: ReactNode;
};

export function Section({ id, className, wrapClassName, children }: Props) {
  const sectionClass = className ? `band ${className}` : 'band';
  const wrapClass = wrapClassName ? `wrap ${wrapClassName}` : 'wrap';

  return (
    <section className={sectionClass} id={id}>
      <div className={wrapClass}>{children}</div>
    </section>
  );
}
