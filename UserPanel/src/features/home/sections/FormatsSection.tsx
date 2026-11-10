import { Section } from '@/components/ui/Section';
import { SectionHead } from '@/components/ui/SectionHead';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { ICONS } from '@/lib/svgIcon';
import { formatAccentClass, type Format } from '@/lib/formats';

export function FormatsSection({ formats }: { formats: Format[] }) {
  return (
    <Section id="formats">
      <SectionHead eyebrow="Формати" eyebrowIcon={ICONS.chat} title="Заняття під твою мету">
        <p>Все — індивідуально, онлайн, у зручний для тебе час.</p>
      </SectionHead>
      <div className="formats-grid">
        {formats.map((item) => (
          <article className="format-card" key={item.id}>
            <div className={`format-icon ${formatAccentClass(item.accent)}`}>
              <SvgIcon svg={item.icon} size={28} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
