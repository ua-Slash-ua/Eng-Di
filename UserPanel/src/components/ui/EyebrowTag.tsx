import { SvgIcon } from '@/components/ui/SvgIcon';

type EyebrowTagProps = {
  icon?: string | null;
  label: string;
  className?: string;
};

export function EyebrowTag({ icon, label, className }: EyebrowTagProps) {
  const classNames = ['eyebrow-tag', className].filter(Boolean).join(' ');
  return (
    <div className={classNames}>
      {icon ? <SvgIcon svg={icon} size={16} /> : null}
      <span>{label}</span>
    </div>
  );
}
