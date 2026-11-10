'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cabinetBasePath, type UserPanelRole } from '@/lib/roles';

export function RoleCabinetGate({
  children,
  allowedRole,
}: {
  children: ReactNode;
  allowedRole: UserPanelRole;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.userRole !== allowedRole) {
      router.replace(cabinetBasePath(user.userRole));
    }
  }, [loading, user, allowedRole, router]);

  if (loading || !user || user.userRole !== allowedRole) {
    return (
      <div className="shell">
        <p className="muted">Завантаження…</p>
      </div>
    );
  }

  if (!pathname.startsWith(cabinetBasePath(allowedRole))) {
    return null;
  }

  return children;
}
