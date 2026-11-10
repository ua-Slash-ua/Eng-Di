'use client';

import { RoleCabinetGate } from '@/features/cabinet/RoleCabinetGate';
import { CabinetFrame } from '@/features/cabinet/CabinetFrame';
import { StudentCabinetNav } from '@/features/cabinet/StudentCabinetNav';

export default function StudentCabinetLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleCabinetGate allowedRole="student">
      <CabinetFrame nav={<StudentCabinetNav />}>{children}</CabinetFrame>
    </RoleCabinetGate>
  );
}
