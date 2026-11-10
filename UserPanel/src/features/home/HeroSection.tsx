import { SvgIcon } from '@/components/ui/SvgIcon';
import { ICONS } from '@/lib/svgIcon';
import { photoStyle, type SiteBlock } from '@/lib/blocks';

/** Keep desktop line breaks; on mobile `.hero-break` becomes a soft space. */
function softTitleHtml(html: string) {
  return html.replace(/<br\s*\/?>/gi, '<span class="hero-break" aria-hidden="true"></span>');
}

export function HeroSection({ block }: { block: SiteBlock }) {
  const stats = block.stats ?? [];
  const photo = photoStyle(block.meta.photo_url);

  return (
    <section className="hero">
      <div className="deco spark" style={{ top: '14%', left: '4%' }}>
        <SvgIcon svg={ICONS.spark} size={26} />
      </div>
      <div className="deco bob" style={{ top: '8%', right: '8%' }}>
        <SvgIcon svg={ICONS.heart} size={30} />
      </div>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          {block.plaque ? <div className="hello-bubble">{block.plaque}</div> : null}
          <h1 dangerouslySetInnerHTML={{ __html: softTitleHtml(block.title) }} />
          {block.meta.description ? <p className="lede">{block.meta.description}</p> : null}
          <div className="hero-actions">
            {block.meta.button1_label ? (
              <a href={block.meta.button1_href || '#lead-form'} className="btn btn-lg">
                {block.meta.button1_label}
              </a>
            ) : null}
            {block.meta.button2_label ? (
              <a href={block.meta.button2_href || '#lead-form'} className="btn ghost btn-lg">
                {block.meta.button2_label}
              </a>
            ) : null}
          </div>
          {stats.length ? (
            <div className="trust-row">
              {stats.map((item) => (
                <div className="trust-pill" key={item.id}>
                  {item.icon ? <SvgIcon svg={item.icon} size={22} /> : null}
                  <div>
                    <b>{item.value}</b>
                    <span>{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="hero-photo-wrap">
          <div className="hero-photo" style={photo} />
          {block.meta.overlay_circle ? <div className="flag-badge">{block.meta.overlay_circle}</div> : null}
          {block.meta.overlay_badge_value || block.meta.overlay_badge_label ? (
            <div className="exp-badge">
              {block.meta.overlay_badge_value ? <b>{block.meta.overlay_badge_value}</b> : null}
              {block.meta.overlay_badge_label ? <span>{block.meta.overlay_badge_label}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
