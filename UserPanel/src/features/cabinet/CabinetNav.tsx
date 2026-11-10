'use client';

import { CabinetRail } from './CabinetRail';

const items = [
  { href: '/cabinet', label: 'Головна', icon: 'home' as const },
  { href: '/cabinet/profile', label: 'Профіль', icon: 'user' as const },
  { href: '/cabinet/lessons', label: 'Мої уроки', icon: 'lesson' as const },
  { href: '/cabinet/schedule', label: 'Розклад', icon: 'schedule' as const },
];

export function CabinetNav() {
  return <CabinetRail items={items} />;
}
