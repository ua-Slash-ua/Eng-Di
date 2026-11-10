import { ReactNode } from 'react';

type FieldCardProps = {
  title: string;
  icon?: ReactNode;
  hint?: string;
  children: ReactNode;
};

export function FieldCard({ title, icon, hint, children }: FieldCardProps) {
  return (
    <div className="field-card">
      <div className="field-card-head">
        {icon}
        <span>{title}</span>
      </div>
      {hint ? <p className="field-card-hint">{hint}</p> : null}
      {children}
    </div>
  );
}
