import { Section } from '@/components/ui/Section';
import { SectionHead } from '@/components/ui/SectionHead';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { SiteBlock } from '@/lib/blocks';
import { ICONS } from '@/lib/svgIcon';
import { discountPercent, formatUah, perLessonPrice, ticketClass, type Tariff } from '@/lib/tariffs';

type PricingSectionProps = {
  block: SiteBlock;
  tariffs: Tariff[];
};

function paymentLabel(count: number) {
  if (count === 1) return '1 платіж';
  if (count >= 2 && count <= 4) return `${count} платежі`;
  return `${count} платежів`;
}

export function PricingSection({ block, tariffs }: PricingSectionProps) {
  const cards = block.tariffs?.length ? block.tariffs : tariffs;
  const eyebrow = block.plaque?.trim() || 'Пакети занять';
  const title = block.title?.trim() || 'Більше уроків — більше можливостей!';
  const description =
    block.meta.description?.trim() || 'Оплата одним платежем за весь пакет — без переплати поурочно.';

  return (
    <Section id="pricing" className="pricing">
      <SectionHead eyebrow={eyebrow} eyebrowIcon={ICONS.ticket} title={title}>
        <p>{description}</p>
      </SectionHead>
      <div className="ticket-row">
        {cards.map((item) => {
          const discount = discountPercent(item.price, item.oldPrice);
          const freezeCount = Math.max(0, item.frozenLessonsPerMonth ?? 0);
          const payments = Math.max(1, item.installmentCount ?? 1);
          return (
            <article className={ticketClass(item.variant)} key={item.id}>
              <div className="ticket-flip">
                <div className="ticket-face ticket-front">
                  {item.popular ? (
                    <div className="popular-tag">
                      <SvgIcon svg={ICONS.crown} size={16} /> Популярний вибір
                    </div>
                  ) : null}
                  {discount ? <div className="discount-chip">-{discount}%</div> : null}
                  <h3>{item.title}</h3>
                  <SvgIcon svg={item.icon || ICONS.book} size={34} className="book-ic" />
                  <div className="price">
                    {formatUah(item.price)} <span>грн</span>
                  </div>
                  {item.oldPrice ? <div className="old-price">{formatUah(item.oldPrice)} грн</div> : null}
                  <div className="per-lesson">{formatUah(perLessonPrice(item.price, item.lessons))} грн / урок</div>
                  <hr />
                  <div className="ticket-note">{item.note}</div>
                </div>

                <div className="ticket-face ticket-back">
                  <h3>{item.title}</h3>
                  <p className="ticket-back-copy">Додаткова інформація по тарифу</p>
                  <div className="ticket-meta-list">
                    <div className="ticket-meta-item">
                      <span>К-ть заморозок</span>
                      <b>{freezeCount} / міс</b>
                    </div>
                    <div className="ticket-meta-item">
                      <span>К-ть платежів</span>
                      <b>{paymentLabel(payments)}</b>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
