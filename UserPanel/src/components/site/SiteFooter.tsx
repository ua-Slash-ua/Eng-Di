import type { SiteContacts } from '@/lib/contacts';
import { SiteBrand } from './SiteBrand';

type SiteFooterProps = {
  contacts: SiteContacts;
  logoUrl?: string | null;
};

export function SiteFooter({ contacts, logoUrl }: SiteFooterProps) {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-col" style={{ maxWidth: 260 }}>
            <div className="logo" style={{ marginBottom: 'calc(10 * var(--u))' }}>
              <SiteBrand logoUrl={logoUrl} />
            </div>
            <p>Індивідуальні заняття англійською онлайн — для дорослих і підлітків.</p>
          </div>
          <div className="footer-col">
            <h5>Навчання</h5>
            <a href="/#formats">Розмовна практика</a>
            <a href="/#formats">Граматика</a>
            <a href="/#formats">Підготовка до іспитів</a>
            <a href="/#pricing">Пакети занять</a>
          </div>
          <div className="footer-col">
            <h5>Контакти</h5>
            <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
            <a href={contacts.phoneHref || `tel:${contacts.phone}`}>{contacts.phone}</a>
            {contacts.socials.length ? (
              <span className="footer-socials">
                {contacts.socials.map((item, index) => (
                  <span key={`${item.label}-${index}`}>
                    {index > 0 ? ' · ' : null}
                    <a href={item.url || '#'} target="_blank" rel="noreferrer">
                      {item.label}
                    </a>
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 EngDi</span>
          <span>Політика конфіденційності · Умови занять</span>
        </div>
      </div>
    </footer>
  );
}
