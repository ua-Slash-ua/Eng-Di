'use client';

import { ReactNode, Suspense, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PanelLeft } from 'lucide-react';
import Sidebar, { useSidebarCollapsed } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';
import { getTopbarTitle } from './getTopbarTitle';

const MOBILE_MQ = '(max-width: 47.9375em)';

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches;
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle, close } = useSidebarCollapsed();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Close drawer after navigation on phones (skip first paint).
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    if (isMobileViewport()) {
      close();
    }
  }, [pathname, close]);

  // Lock page scroll while the mobile drawer is open.
  useEffect(() => {
    if (collapsed || !isMobileViewport()) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [collapsed]);

  if (loading || !user) {
    return (
      <div className="shell">
        <p className="muted">Завантаження…</p>
      </div>
    );
  }

  return (
    <div className={`app${collapsed ? ' sidebar-collapsed' : ''}`}>
      {collapsed ? null : (
        <button className="sidebar-backdrop" type="button" aria-label="Закрити меню" onClick={close} />
      )}
      <Suspense fallback={<aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`} />}>
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </Suspense>
      <div className="main">
        <div className="topbar">
          <button
            className="icon-btn topbar-toggle"
            type="button"
            onClick={toggle}
            title="Меню"
            aria-label={collapsed ? 'Відкрити меню' : 'Закрити меню'}
            aria-expanded={!collapsed}
          >
            <PanelLeft size={20} />
          </button>
          <div className="topbar-title">{getTopbarTitle(pathname ?? '')}</div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
