import { LeadForm } from '@/features/home/LeadForm';
import type { PageBlock } from './page';

function text(content: Record<string, unknown>, key: string, fallback = '') {
  return typeof content[key] === 'string' ? (content[key] as string) : fallback;
}

/** Legacy CMS block renderer — not used by the live homepage. */
export function PageBlocks({ blocks }: { blocks: PageBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        if (block.type === 'HERO') {
          return (
            <section className="hero" key={block.id}>
              <div>
                <p className="kicker">{text(block.content, 'kicker')}</p>
                <h1>{text(block.content, 'title')}</h1>
                <p className="lead">{text(block.content, 'text')}</p>
                <a className="btn" href="#lead-form">
                  {text(block.content, 'buttonText', 'Записатись зараз')}
                </a>
              </div>
              <div
                className="hero-photo"
                style={{ backgroundImage: `url(${text(block.content, 'imageUrl')})` }}
              />
            </section>
          );
        }

        if (block.type === 'ABOUT') {
          return (
            <section className="section" key={block.id}>
              <p className="kicker">ПРО ШКОЛУ</p>
              <h2>{text(block.content, 'title')}</h2>
              <p className="lead">{text(block.content, 'text')}</p>
            </section>
          );
        }

        if (block.type === 'TARIFFS') {
          const items = Array.isArray(block.content.items) ? block.content.items : [];
          return (
            <section className="section" key={block.id}>
              <p className="kicker">ТАРИФИ</p>
              <h2>{text(block.content, 'title', 'Тарифи')}</h2>
              <div className="grid">
                {items.slice(0, 3).map((item, index) => {
                  const tariff = item as Record<string, string>;
                  return (
                    <article className="course" key={`${block.id}-${index}`}>
                      <span className="muted">{tariff.name}</span>
                      <b>{tariff.price}</b>
                      <p>{tariff.description}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        }

        if (block.type === 'RULES') {
          const items = Array.isArray(block.content.items) ? block.content.items : [];
          return (
            <section className="section" key={block.id}>
              <p className="kicker">ПРАВИЛА</p>
              <h2>{text(block.content, 'title', 'Правила школи')}</h2>
              <div className="course">
                {items.map((item, index) => (
                  <p key={`${block.id}-${index}`}>{String(item)}</p>
                ))}
              </div>
            </section>
          );
        }

        if (block.type === 'FORM') {
          return (
            <LeadForm
              key={block.id}
              title={text(block.content, 'title', 'Заявка')}
              text={text(block.content, 'text')}
              buttonText={text(block.content, 'buttonText', 'Надіслати')}
            />
          );
        }

        return null;
      })}
    </>
  );
}
