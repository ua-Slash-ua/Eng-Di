'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NewBadge } from '@/components/NewBadge';
import { SiteBrand } from '@/components/site/SiteBrand';

export type CabinetRailItem = {
  href: string;
  label: string;
  icon: CabinetIconName;
  badge?: 'new';
};

export type CabinetIconName = 'home' | 'user' | 'tariff' | 'lesson' | 'schedule' | 'classes' | 'library' | 'review';

function RailIcon({ name }: { name: CabinetIconName }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'user':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 19.2c1.4-3.2 3.9-4.8 7-4.8s5.6 1.6 7 4.8" />
        </svg>
      );
    case 'tariff':
      return (
        <svg {...props}>
          <path d="M12 3v18" />
          <path d="M16.4 7.4c-.8-1.5-2.1-2.2-4.4-2.2-2.7 0-4.4 1.4-4.4 3.3 0 4.5 8.8 2.2 8.8 6.6 0 2-1.8 3.5-4.6 3.5-2.5 0-4.1-.9-5-2.5" />
        </svg>
      );
    case 'lesson':
      return (
        <svg {...props}>
          <path d="M4 6.5h11.5a2 2 0 0 1 2 2V20H6a2 2 0 0 1-2-2z" />
          <path d="M17.5 8.5H20v11.5a2 2 0 0 1-2 2H6" />
        </svg>
      );
    case 'schedule':
      return (
        <svg {...props}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
        </svg>
      );
    case 'classes':
      return (
        <svg {...props}>
          <circle cx="8.2" cy="8.2" r="2.4" />
          <circle cx="15.8" cy="8.2" r="2.4" />
          <path d="M4.2 18.5c.6-2.6 2.3-4 4-4s3.4 1.4 4 4" />
          <path d="M11.8 18.5c.6-2.6 2.3-4 4-4s3.4 1.4 4 4" />
        </svg>
      );
    case 'library':
      return (
        <svg {...props}>
          <path d="M4 19.5V4.5A1.5 1.5 0 0 1 5.5 3h13A1.5 1.5 0 0 1 20 4.5v15a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19.5z" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );
    case 'review':
      return (
        <svg {...props}>
          <path d="M12 17.8 6.2 20l1-6.5L2 9.5l6.6-.5L12 3l3.4 5.9 6.6.5-5.2 4 1 6.5z" />
        </svg>
      );
    default:
      return null;
  }
}

export function CabinetRail({ items }: { items: CabinetRailItem[] }) {
  const pathname = usePathname() ?? '';
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/branding')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { settings?: { logoUrl?: string | null } } | null) => {
        setLogoUrl(payload?.settings?.logoUrl ?? null);
      })
      .catch(() => undefined);
  }, []);

  return (
    <aside className="sidebar">
      <Link href="/" className="logo cab-brand" title="EngDi">
        <SiteBrand logoUrl={logoUrl} />
      </Link>
      <nav className="sidebar-nav" aria-label="Кабінет">
        {items.map((item) => {
          const depth = item.href.split('/').filter(Boolean).length;
          const active =
            pathname === item.href || (depth > 2 && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[active ? 'active' : '', item.badge === 'new' ? 'has-new-badge' : '']
                .filter(Boolean)
                .join(' ') || undefined}
              title={item.label}
            >
              <span className="sidebar-nav-icon">
                <RailIcon name={item.icon} />
                {item.badge === 'new' ? <NewBadge className="new-badge--rail" /> : null}
              </span>
              <span className="sidebar-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
