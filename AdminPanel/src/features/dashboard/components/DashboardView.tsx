'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, FileText, Shield, Users } from 'lucide-react';
import { PageHead } from '@/components/ui/PageHead';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { greeting, todayLabel } from '@/lib/format';
import type { AuthSummary } from '@/features/users/types';

type Stats = { users: number; admins: number; pages: number };

export function DashboardView() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [auth, setAuth] = useState<AuthSummary | null>(null);

  useEffect(() => {
    api<Stats>('/api/admin/stats').then(setStats).catch(() => undefined);
    api<AuthSummary>('/api/admin/auth/summary').then(setAuth).catch(() => undefined);
  }, []);

  return (
    <>
      <PageHead title={greeting(user?.name || 'адміне')} description={`${todayLabel()} · панель керування EngDi`} />
      <div className="stats stats-2">
        <Link href="/users?role=user" className="stat-card">
          <div className="top-row">
            <span className="stat-label">Учні</span>
            <div className="stat-icon" style={{ background: 'var(--mint-soft)', color: 'var(--mint)' }}>
              <Users size={16} />
            </div>
          </div>
          <div className="stat-value">{stats?.users ?? '—'}</div>
          <div className="stat-delta up">у системі</div>
        </Link>
        <Link href="/users?role=admin" className="stat-card">
          <div className="top-row">
            <span className="stat-label">Адміністратори</span>
            <div className="stat-icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
              <Shield size={16} />
            </div>
          </div>
          <div className="stat-value">{stats?.admins ?? '—'}</div>
          <div className="stat-delta" style={{ color: 'var(--text-soft)' }}>
            доступ до панелі
          </div>
        </Link>
        <Link href="/pages" className="stat-card">
          <div className="top-row">
            <span className="stat-label">Сторінки</span>
            <div className="stat-icon" style={{ background: 'var(--yellow-soft)', color: 'var(--yellow)' }}>
              <FileText size={16} />
            </div>
          </div>
          <div className="stat-value">{stats?.pages ?? '—'}</div>
          <div className="stat-delta" style={{ color: 'var(--text-soft)' }}>
            для виводу на сайті
          </div>
        </Link>
        <Link href="/analytics/users" className="stat-card">
          <div className="top-row">
            <span className="stat-label">Входи сьогодні</span>
            <div className="stat-icon" style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}>
              <Activity size={16} />
            </div>
          </div>
          <div className="stat-value">{auth?.loginsToday ?? '—'}</div>
          <div className="stat-delta" style={{ color: 'var(--text-soft)' }}>
            сесій: {auth?.activeSessions ?? '—'}
          </div>
        </Link>
      </div>
    </>
  );
}
