import { Section } from '@/components/ui/Section';
import { SectionHead } from '@/components/ui/SectionHead';
import type { SiteBlock } from '@/lib/blocks';
import { ICONS } from '@/lib/svgIcon';
import { ruleAccentClass, type SchoolRule } from '@/lib/rules';

type RulesSectionProps = {
  block: SiteBlock;
  rules: SchoolRule[];
};

export function RulesSection({ block, rules }: RulesSectionProps) {
  const items = block.rules?.length ? block.rules : rules;
  const eyebrow = block.plaque?.trim() || 'Правила';
  const title = block.title?.trim() || 'Щоб заняття були зручними для нас обох';
  const description = block.meta.description?.trim() || 'Коротко про оплату, пропуски й перенесення';

  return (
    <Section id="rules">
      <div className="rules-band">
        <SectionHead eyebrow={eyebrow} eyebrowIcon={ICONS.clipboard} title={title}>
          <p>{description}</p>
        </SectionHead>
        <div className="rules-list">
          {items.map((item, index) => (
            <div className="rule-item" key={item.id}>
              <div className={`rule-num ${ruleAccentClass(item.accent)}`}>{index + 1}</div>
              <div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
