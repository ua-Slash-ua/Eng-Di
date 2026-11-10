import { resolveIcon } from '@/lib/svgIcon';

type SvgIconProps = {
  svg?: string | null;
  size?: number;
  className?: string;
};

export function SvgIcon({ svg, size = 24, className }: SvgIconProps) {
  const html = resolveIcon(svg);
  const classNames = ['svg-icon', className].filter(Boolean).join(' ');

  if (!html) {
    return null;
  }

  return (
    <span
      className={classNames}
      style={{ width: size, height: size }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
