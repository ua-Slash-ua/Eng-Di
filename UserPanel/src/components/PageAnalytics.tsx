'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export function PageAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === '/login') {
      return;
    }
    void api('/api/auth/page-view', {
      method: 'POST',
      body: JSON.stringify({ path: pathname }),
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
