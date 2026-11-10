'use client';

import { AdminShell } from '@/features/shell/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
