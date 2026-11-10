'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  DoorOpen,
  Eye,
  House,
  KeyRound,
  LayoutDashboard,
  ShieldOff,
  UserMinus,
  Users,
  Wifi,
} from 'lucide-react';
import { PageHead } from '@/components/ui/PageHead';
import { FormAlerts } from '@/components/ui/FormAlerts';
import { initials } from '@/lib/format';
import { authAdminApi } from '@/features/users/api';
import type { AuthOverview, AuthRankedUser } from '@/features/users/types';

export function UsersAnalyticsView() {
  const [data, setData] = useState<AuthOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    authAdminApi
      .overview()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Помилка'));
  }, []);

  return (
    <>
      <PageHead
        title="Користувачі"
        description="Загальна статистика акаунтів, входів і переглядів сайту."
      />
      <FormAlerts error={error} />

      <div className="stats">
        <StatCard
          label="Усього акаунтів"
          value={data?.totalUsers}
          hint={`${data?.students ?? '—'} учнів · ${data?.admins ?? '—'} адмінів`}
          icon={<Users size={16} />}
          color="mint"
        />
        <StatCard
          label="Онлайн зараз"
          value={data?.onlineNow}
          hint={`${data?.activeSessions ?? '—'} активних сесій`}
          icon={<Wifi size={16} />}
          color="purple"
        />
        <StatCard
          label="Увійшли сьогодні"
          value={data?.uniqueLoginsToday}
          hint={`${data?.loginsToday ?? '—'} входів · ${data?.logoutsToday ?? '—'} виходів`}
          icon={<DoorOpen size={16} />}
          color="pink"
        />
        <StatCard
          label="Перегляди сьогодні"
          value={data?.pageViewsToday}
          hint={`головна ${data?.homeViewsToday ?? '—'} · кабінет ${data?.cabinetViewsToday ?? '—'}`}
          icon={<Eye size={16} />}
          color="yellow"
        />
      </div>

      <div className="stats">
        <StatCard
          label="Ніколи не входили"
          value={data?.neverLoggedIn}
          hint="акаунти без жодного входу"
          icon={<UserMinus size={16} />}
          color="pink"
        />
        <StatCard
          label="Заблоковані"
          value={data?.blockedUsers}
          hint={`${data?.activeAccounts ?? '—'} активних`}
          icon={<ShieldOff size={16} />}
          color="purple"
        />
        <StatCard
          label="Нові за тиждень"
          value={data?.newUsersWeek}
          hint={`сьогодні: ${data?.newUsersToday ?? '—'}`}
          icon={<Users size={16} />}
          color="mint"
        />
        <StatCard
          label="Унікальні входи за тиждень"
          value={data?.uniqueLoginsWeek}
          hint={`${data?.loginsWeek ?? '—'} спроб входу`}
          icon={<KeyRound size={16} />}
          color="yellow"
        />
      </div>

      <div className="grid-2">
        <RankPanel
          title="Найчастіше входять"
          empty="Поки немає входів"
          items={data?.topLogins}
          unit="входів"
        />
        <RankPanel
          title="Найчастіше в кабінеті"
          empty="Поки немає переглядів кабінету"
          items={data?.topCabinet}
          unit="відвідувань"
        />
      </div>

      <div className="grid-2" style={{ marginTop: '1.3889vw' }}>
        <RankPanel
          title="Найчастіше на головній"
          empty="Поки немає переглядів головної"
          items={data?.topHome}
          unit="переглядів"
        />
        <div className="panel">
          <div className="panel-head">
            <h3>Ще цифри</h3>
          </div>
          <div className="form-box">
            <Insight
              icon={<House size={16} />}
              label="Головна за весь час"
              value={data?.homeViews}
            />
            <Insight
              icon={<LayoutDashboard size={16} />}
              label="Кабінет за весь час"
              value={data?.cabinetViews}
            />
            <Insight
              icon={<Eye size={16} />}
              label="Перегляди за тиждень"
              value={data?.pageViewsWeek}
            />
            <Insight
              icon={<KeyRound size={16} />}
              label="Зміни пароля за тиждень"
              value={data?.passwordChangesWeek}
            />
            <Insight
              icon={<DoorOpen size={16} />}
              label="Невдалі входи сьогодні"
              value={data?.failedLoginsToday}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  color,
}: {
  label: string;
  value: number | undefined;
  hint: string;
  icon: ReactNode;
  color: 'mint' | 'purple' | 'pink' | 'yellow';
}) {
  const tones = {
    mint: { background: 'var(--mint-soft)', color: 'var(--mint)' },
    purple: { background: 'var(--purple-soft)', color: 'var(--purple)' },
    pink: { background: 'var(--pink-soft)', color: 'var(--pink)' },
    yellow: { background: 'var(--yellow-soft)', color: 'var(--yellow)' },
  };
  return (
    <div className="stat-card">
      <div className="top-row">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={tones[color]}>
          {icon}
        </div>
      </div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-delta" style={{ color: 'var(--text-soft)' }}>
        {hint}
      </div>
    </div>
  );
}

function RankPanel({
  title,
  empty,
  items,
  unit,
}: {
  title: string;
  empty: string;
  items: AuthRankedUser[] | undefined;
  unit: string;
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
      </div>
      <div className="form-box">
        {!items?.length ? (
          <p className="muted">{empty}</p>
        ) : (
          items.map((item) => {
            const href = item.user ? `/users/${item.user.id}` : undefined;
            const content = (
              <>
                <div className="mini-av">{initials(item.user?.name || '', item.user?.email || '')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{item.user?.name || 'Без імені'}</b>
                  <span>{item.user?.email || 'невідомий акаунт'}</span>
                </div>
                <b>
                  {item.count} {unit}
                </b>
              </>
            );
            return href ? (
              <Link className="usage-row" href={href} key={`${href}-${item.count}`} style={{ alignItems: 'center' }}>
                {content}
              </Link>
            ) : (
              <div className="usage-row" key={`anon-${item.count}`} style={{ alignItems: 'center' }}>
                {content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Insight({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="usage-row" style={{ alignItems: 'center' }}>
      <div className="stat-icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
        {icon}
      </div>
      <span style={{ flex: 1 }}>{label}</span>
      <b>{value ?? '—'}</b>
    </div>
  );
}
