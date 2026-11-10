import { Section } from '@/components/ui/Section';
import { SectionHead } from '@/components/ui/SectionHead';
import type { SiteBlock } from '@/lib/blocks';
import { ICONS } from '@/lib/svgIcon';

type LevelItem = {
  code: string;
  title: string;
  description: string;
};

const FALLBACK_LEVELS: LevelItem[] = [
  { code: 'A1', title: 'Старт', description: 'Прості фрази й побут' },
  { code: 'A2', title: 'База', description: 'Впевнені діалоги' },
  { code: 'B1', title: 'Середній', description: 'Про роботу й подорожі' },
  { code: 'B2', title: 'Вільний', description: 'Дискусії без пауз' },
  { code: 'C1', title: 'Просунутий', description: 'Нюанси й гумор' },
  { code: 'C2', title: 'Носійський', description: 'Мислиш англійською' },
];

function parseLevels(value?: string): LevelItem[] {
  try {
    const parsed = JSON.parse(value ?? '') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        const item = entry && typeof entry === 'object' ? (entry as Partial<LevelItem>) : {};
        return {
          code: String(item.code ?? '').trim(),
          title: String(item.title ?? '').trim(),
          description: String(item.description ?? '').trim(),
        };
      })
      .filter((item) => item.code || item.title || item.description);
  } catch {
    return [];
  }
}

export function LevelsSection({ block }: { block: SiteBlock }) {
  const eyebrow = block.plaque?.trim() || 'Прогрес';
  const title = block.title?.trim() || 'Від першого «hello» до вільної розмови';
  const description =
    block.meta.description?.trim() ||
    'Ведуть учня по шкалі CEFR крок за кроком — з чіткими критеріями переходу на наступний рівень.';
  const levels = parseLevels(block.meta.levels);
  const items = levels.length > 0 ? levels : FALLBACK_LEVELS;

  return (
    <Section id="levels">
      <SectionHead eyebrow={eyebrow} eyebrowIcon={ICONS.chart} title={title}>
        <p>{description}</p>
      </SectionHead>
      <div className="levels-band">
        <div className="level-row">
          {items.map((item, index) => (
            <div className="level-item" key={`${item.code}-${index}`}>
              <div className="level-num">{item.code || String(index + 1)}</div>
              {item.title ? <h4>{item.title}</h4> : null}
              {item.description ? <p>{item.description}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
