'use client';

import { useAuth } from '@/lib/auth';
import { CabinetPage } from './CabinetPage';
import { TodayScheduleBox } from './home/TodayScheduleBox';

export function CabinetHome({ title = 'Сьогодні' }: { title?: string }) {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  return (
    <CabinetPage wide title={title} lead={`Ось що заплановано на сьогодні.`}>
      <div className="dash-stack">
        <TodayScheduleBox role={user.userRole} />
      </div>
    </CabinetPage>
  );
}
