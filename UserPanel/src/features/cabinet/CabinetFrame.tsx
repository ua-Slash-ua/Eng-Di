'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { CabinetMast } from './CabinetMast';
import { rememberCabinetPath } from './cabinetNavTrail';

export function CabinetFrame({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  rememberCabinetPath(usePathname());

  return (
    <div className="cabinet">
      {nav}
      <div className="cabinet-stage">
        <CabinetMast />
        <div className="cabinet-main">{children}</div>
      </div>
    </div>
  );
}
