import type { ReactNode } from 'react';
import { CabinetFrame } from './CabinetFrame';
import { CabinetNav } from './CabinetNav';

export function CabinetShell({ children }: { children: ReactNode }) {
  return <CabinetFrame nav={<CabinetNav />}>{children}</CabinetFrame>;
}
