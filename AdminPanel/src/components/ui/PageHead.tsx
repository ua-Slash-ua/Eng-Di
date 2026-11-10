import Link from 'next/link';
import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

type PageHeadProps = {
  backHref?: string;
  backLabel?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  sticky?: boolean;
};

export function PageHead({ backHref, backLabel, title, description, actions, sticky }: PageHeadProps) {
  return (
    <div className={`page-head${sticky ? ' is-sticky' : ''}`}>
      <div>
        {backHref ? (
          <Link href={backHref} className="back-link">
            <ArrowLeft size={16} /> {backLabel || 'Назад'}
          </Link>
        ) : null}
        <h1>{title}</h1>
        {description ? (typeof description === 'string' ? <p>{description}</p> : description) : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </div>
  );
}
