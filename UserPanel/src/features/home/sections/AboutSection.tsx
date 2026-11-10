import { EyebrowTag } from '@/components/ui/EyebrowTag';
import { Section } from '@/components/ui/Section';
import { photoStyle, type SiteBlock } from '@/lib/blocks';
import { ICONS } from '@/lib/svgIcon';
import type { AboutStat } from '@/lib/about-stats';

const DEFAULT_TITLE = 'Привіт, це EngDi — і ми вчимо говорити, а не боятись помилок';
const DEFAULT_ROLE = 'Онлайн · 7 років практики · з будь-якої точки світу';
const DEFAULT_BODY =
  'Англійська для дорослих і підлітків: від нуля до вільної розмови. Без груп на 10 людей і шаблонних підручників — програма під твою мету: подорожі, робота, іспит чи переїзд.\n\nКожне заняття — це план, зворотний звʼязок і чіткий наступний крок. Ти завжди знаєш, над чим працюєш і чому.';

function bodyParagraphs(body: string) {
  const text = body.trim() || DEFAULT_BODY;
  return text.split(/\n\s*\n/).filter(Boolean);
}

export function AboutSection({ block, stats }: { block: SiteBlock; stats: AboutStat[] }) {
  const photo = photoStyle(block.meta.photo_url, '--about-photo');
  const cards = block.stats?.length
    ? block.stats.map((item) => ({ id: item.id, value: item.value, label: item.label }))
    : stats.map((item) => ({ id: item.id, value: item.value, label: item.label }));
  const eyebrow = block.plaque?.trim() || 'Про школу';
  const title = block.title?.trim() || DEFAULT_TITLE;
  const role = block.meta.accent_text?.trim() || DEFAULT_ROLE;
  const placeholder = block.meta.photo_placeholder?.trim() || 'E';

  return (
    <Section id="about" wrapClassName="about-grid">
      <div className={`about-photo${photo ? ' has-photo' : ''}`} style={photo}>
        <div className="tape" />
        {!photo ? placeholder : null}
      </div>
      <div className="about-copy">
        <EyebrowTag icon={ICONS.leaf} label={eyebrow} />
        <h3>{title}</h3>
        <div className="role">{role}</div>
        {bodyParagraphs(block.meta.body ?? '').map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
        <div className="about-facts">
          {cards.map((item) => (
            <div className="fact-card" key={item.id}>
              <b>{item.value}</b>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
