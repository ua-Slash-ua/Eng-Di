import type { ReactNode } from 'react';
import { EyebrowTag } from '@/components/ui/EyebrowTag';

type Props = {
  eyebrow: string;
  eyebrowIcon?: string | null;
  title: string;
  children?: ReactNode;
};

export function SectionHead({ eyebrow, eyebrowIcon, title, children }: Props) {
  return (
    <div className="section-head">
      <EyebrowTag icon={eyebrowIcon} label={eyebrow} />
      <h2 dangerouslySetInnerHTML={{ __html: title }} />
      {children}
    </div>
  );
}
