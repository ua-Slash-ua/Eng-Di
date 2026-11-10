'use client';

import { CabinetRail } from './CabinetRail';

const items = [
  { href: '/cabinet/teacher', label: 'Головна', icon: 'home' as const },
  { href: '/cabinet/teacher/profile', label: 'Профіль', icon: 'user' as const },
  { href: '/cabinet/teacher/classes', label: 'Мої класи', icon: 'classes' as const },
  { href: '/cabinet/teacher/lessons', label: 'Заняття', icon: 'lesson' as const },
  { href: '/cabinet/teacher/schedule', label: 'Розклад', icon: 'schedule' as const },
  { href: '/cabinet/teacher/library', label: 'Бібліотека', icon: 'library' as const },
];

export function TeacherCabinetNav() {
  return <CabinetRail items={items} />;
}
