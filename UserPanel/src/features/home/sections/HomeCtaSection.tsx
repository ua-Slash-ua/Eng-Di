import { Section } from '@/components/ui/Section';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { SiteBlock } from '@/lib/blocks';
import { ICONS } from '@/lib/svgIcon';

type HomeCtaSectionProps = {
  block: SiteBlock;
};

export function HomeCtaSection({ block }: HomeCtaSectionProps) {
  const title = block.title?.trim() || 'Перше заняття — знайомче й безкоштовне';
  const description =
    block.meta.description?.trim() ||
    'Визначимо твій рівень, мету і складемо план навчання за 30 хвилин.';
  const buttonLabel = block.meta.button_label?.trim() || 'Залишити заявку';
  const buttonHref = block.meta.button_href?.trim() || '#lead-form';

  return (
    <Section>
      <div className="cta-band">
        <div className="deco bob" style={{ top: '10%', left: '6%' }}>
          <SvgIcon svg={ICONS.spark} size={28} />
        </div>
        <div className="deco bob" style={{ bottom: '10%', right: '8%' }}>
          <SvgIcon svg={ICONS.heart} size={24} />
        </div>
        <h2 dangerouslySetInnerHTML={{ __html: title }} />
        <p>{description}</p>
        <a href={buttonHref} className="btn btn-lg">
          {buttonLabel}
        </a>
      </div>
    </Section>
  );
}
