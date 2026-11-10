'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cabinetBasePath, canAccessUserPanel } from '@/lib/roles';

export default function LegacyCabinetRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!canAccessUserPanel(user)) {
      router.replace('/login');
      return;
    }
    router.replace(cabinetBasePath(user.userRole));
  }, [loading, user, router]);

  return (
    <div className="shell">
      <p className="muted">Завантаження…</p>
    </div>
  );
}
