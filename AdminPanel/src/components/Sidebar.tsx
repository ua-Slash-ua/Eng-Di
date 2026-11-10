'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { initials } from '@/lib/format';
import { filterNav, groupHasActive } from '@/lib/nav';

const COLLAPSE_KEY = 'engdi_admin_sidebar_collapsed';
const OPEN_KEY = 'engdi_admin_sidebar_open';

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? '';
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const visibleNav = user ? filterNav(user) : [];

  useEffect(() => {
    if (!user) return;
    const groups = filterNav(user);
    const stored = localStorage.getItem(OPEN_KEY);
    const next: Record<string, boolean> = {};
    if (stored) {
      try {
        Object.assign(next, JSON.parse(stored) as Record<string, boolean>);
      } catch {
        /* ignore */
      }
    }
    for (const group of groups) {
      if (groupHasActive(group, pathname, search)) {
        next[group.id] = true;
      } else if (next[group.id] === undefined) {
        next[group.id] = true;
      }
    }
    setOpen(next);
  }, [pathname, search, user]);

  function toggleGroup(id: string) {
    setOpen((current) => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem(OPEN_KEY, JSON.stringify(next));
      return next;
    });
  }

  if (!user) return null;

  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <div className="side-logo">
        <span className="bubble">E</span>
        <span className="side-logo-text">EngDi</span>
        <button className="side-collapse" type="button" onClick={onToggle} title={collapsed ? 'Показати меню' : 'Сховати меню'}>
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="side-nav">
        {visibleNav.map((group) => {
          const Icon = group.icon;
          const expanded = open[group.id] !== false;
          const groupActive = groupHasActive(group, pathname, search);
          return (
            <div className={`acc${expanded ? ' is-open' : ''}${groupActive ? ' is-active' : ''}`} key={group.id}>
              <button
                className="acc-btn"
                type="button"
                onClick={() => toggleGroup(group.id)}
                data-label={group.label}
                title={collapsed ? group.label : undefined}
              >
                <Icon className="ic" size={18} />
                <span className="nav-label">{group.label}</span>
                <ChevronDown className="acc-chevron" size={14} />
              </button>
              {expanded ? (
                <div className="side-children">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const active = item.match(pathname, search);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`side-link${active ? ' active' : ''}`}
                        data-label={item.label}
                        title={collapsed ? item.label : undefined}
                      >
                        <ItemIcon className="ic" size={18} />
                        <span className="nav-label">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="side-bottom">
        <div className="side-user" title={collapsed ? user.name || user.email : undefined}>
          <div className="av">{initials(user.name, user.email)}</div>
          <div className="side-user-meta">
            <div className="name">{user.name || 'Адмін'}</div>
            <div className="role">{user.isSuperAdmin ? 'Супер-адмін' : user.adminRole?.name ?? 'Адмін'}</div>
          </div>
        </div>
        <button className="side-logout" type="button" onClick={logout} data-label="Вийти" title={collapsed ? 'Вийти' : undefined}>
          <LogOut className="ic" size={18} />
          <span className="nav-label">Вийти</span>
        </button>
      </div>
    </aside>
  );
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSE_KEY);
    if (stored === '1' || stored === '0') {
      setCollapsed(stored === '1');
      return;
    }
    setCollapsed(window.innerWidth <= 767);
  }, []);

  const persist = useCallback((next: boolean) => {
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const close = useCallback(() => {
    persist(true);
  }, [persist]);

  return { collapsed, toggle, close };
}
