'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { SiteBrand } from '@/components/site/SiteBrand';

export function AuthShell({
  title,
  lead,
  children,
  footer,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
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
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-head">
          <Link href="/" className="auth-brand" title="EngDi">
            <SiteBrand logoUrl={logoUrl} />
          </Link>
        </header>
        <div className="auth-body">
          <h1>{title}</h1>
          {lead ? <p className="auth-lead">{lead}</p> : null}
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
