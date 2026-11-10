'use client';

import { RoleCabinetGate } from '@/features/cabinet/RoleCabinetGate';
import { CabinetFrame } from '@/features/cabinet/CabinetFrame';
import { TeacherCabinetNav } from '@/features/cabinet/TeacherCabinetNav';

export default function TeacherCabinetLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleCabinetGate allowedRole="teacher">
      <CabinetFrame nav={<TeacherCabinetNav />}>{children}</CabinetFrame>
    </RoleCabinetGate>
  );
}
