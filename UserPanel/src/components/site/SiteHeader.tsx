'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { SiteBrand } from '@/components/site/SiteBrand';

const NAV_ITEMS = [
  { href: '/#about', label: 'Про школу' },
  { href: '/#levels', label: 'Рівні' },
  { href: '/#pricing', label: 'Пакети занять', short: 'Пакети' },
  { href: '/#rules', label: 'Правила' },
  { href: '/#reviews', label: 'Відгуки' },
] as const;

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <a key={item.href} href={item.href} onClick={onNavigate}>
          {'short' in item ? (
            <>
              <span className="nav-label-long">{item.label}</span>
              <span className="nav-label-short">{item.short}</span>
            </>
          ) : (
            item.label
          )}
        </a>
      ))}
    </>
  );
}

export function SiteHeader({ logoUrl }: { logoUrl?: string | null }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      {menuOpen ? (
        <button type="button" className="nav-backdrop" aria-label="Закрити меню" onClick={closeMenu} />
      ) : null}

      <header className={`site-header${menuOpen ? ' is-menu-open' : ''}`}>
        <div className="wrap nav">
          <Link href="/" className="logo" onClick={closeMenu}>
            <SiteBrand logoUrl={logoUrl} />
          </Link>

          <nav className="nav-links nav-links-desktop" aria-label="Основна навігація">
            <NavItems />
          </nav>

          <div className="nav-cta">
            {!loading && user ? (
              <Link href="/cabinet" className="nav-user-btn" title="Відкрити кабінет">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.name} className="nav-user-avatar-img" />
                ) : (
                  <span className="nav-user-avatar" aria-hidden>
                    {initial}
                  </span>
                )}
                <span className="nav-user-name">{user.name}</span>
              </Link>
            ) : (
              <Link href="/login" className={`btn-login ${pathname === '/login' ? 'active' : ''}`}>
                <span className="login-label-long">Увійти</span>
                <span className="login-label-short">Увійти</span>
              </Link>
            )}
            <a href="/#lead-form" className="btn nav-cta-btn">
              Записатись
            </a>
            <button
              type="button"
              className={`nav-burger${menuOpen ? ' is-open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls="site-nav-curtain"
              aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="nav-burger-lines" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>

        <div
          className={`nav-curtain${menuOpen ? ' is-open' : ''}`}
          id="site-nav-curtain"
          role="dialog"
          aria-modal="true"
          aria-label="Меню"
        >
          <nav className="nav-links nav-links-mobile" aria-label="Мобільна навігація">
            <NavItems onNavigate={closeMenu} />
          </nav>
          <div className="nav-drawer-cta">
            {!loading && user ? (
              <Link href="/cabinet" className="btn ghost full nav-user-mobile" onClick={closeMenu}>
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={user.name} className="nav-user-avatar-img" />
                ) : (
                  <span className="nav-user-avatar" aria-hidden>
                    {initial}
                  </span>
                )}
                <span>{user.name}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className={`btn ghost full${pathname === '/login' ? ' active' : ''}`}
                onClick={closeMenu}
              >
                Увійти
              </Link>
            )}
            <a href="/#lead-form" className="btn full" onClick={closeMenu}>
              Записатись
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
