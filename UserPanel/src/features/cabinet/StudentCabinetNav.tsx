'use client';

import { CabinetRail } from './CabinetRail';

const items = [
  { href: '/cabinet/student', label: 'Головна', icon: 'home' as const },
  { href: '/cabinet/student/profile', label: 'Профіль', icon: 'user' as const },
  { href: '/cabinet/student/tariffs', label: 'Тарифи', icon: 'tariff' as const },
  { href: '/cabinet/student/lessons', label: 'Заняття', icon: 'lesson' as const },
  { href: '/cabinet/student/schedule', label: 'Розклад', icon: 'schedule' as const },
  { href: '/cabinet/student/materials', label: 'Матеріали', icon: 'library' as const, badge: 'new' as const },
  { href: '/cabinet/student/reviews', label: 'Відгуки', icon: 'review' as const },
];

export function StudentCabinetNav() {
  return <CabinetRail items={items} />;
}
