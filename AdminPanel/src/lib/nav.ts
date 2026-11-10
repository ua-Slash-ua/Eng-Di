import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Boxes,
  ChartColumn,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Files,
  FolderOpen,
  GraduationCap,
  Hash,
  Home,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  Mail,
  MessageSquareQuote,
  PanelsTopLeft,
  Settings,
  Shapes,
  Shield,
  Tags,
  Ticket,
  Users,
  UsersRound,
  Video,
} from 'lucide-react';
import type { User } from './permissions';
import { hasPermission } from './permissions';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** One permission key, or any of the listed keys grants visibility. */
  permission?: string | string[];
  match: (pathname: string, search: string) => boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const nav: NavGroup[] = [
  {
    id: 'overview',
    label: 'Огляд',
    icon: LayoutDashboard,
    items: [
      {
        href: '/',
        label: 'Дашборд',
        icon: Home,
        permission: 'dashboard.read',
        match: (pathname) => pathname === '/',
      },
      {
        href: '/settings',
        label: 'Налаштування',
        icon: Settings,
        permission: 'settings.read',
        match: (pathname) => pathname.startsWith('/settings'),
      },
    ],
  },
  {
    id: 'users',
    label: 'Користувачі',
    icon: Users,
    items: [
      {
        href: '/users',
        label: 'Усі користувачі',
        icon: UsersRound,
        permission: 'users.read',
        match: (pathname, search) => {
          const role = new URLSearchParams(search).get('role');
          return pathname.startsWith('/users') && !pathname.startsWith('/users/activity') && !role;
        },
      },
      {
        href: '/users?role=student',
        label: 'Учні',
        icon: GraduationCap,
        permission: 'users.read',
        match: (pathname, search) => pathname === '/users' && new URLSearchParams(search).get('role') === 'student',
      },
      {
        href: '/users?role=teacher',
        label: 'Вчителі',
        icon: UsersRound,
        permission: 'users.read',
        match: (pathname, search) => pathname === '/users' && new URLSearchParams(search).get('role') === 'teacher',
      },
      {
        href: '/users?role=admin,super_admin',
        label: 'Адміністратори',
        icon: Shield,
        permission: 'users.read',
        match: (pathname, search) => pathname === '/users' && new URLSearchParams(search).get('role') === 'admin,super_admin',
      },
      {
        href: '/access-roles',
        label: 'Ролі доступу',
        icon: KeyRound,
        permission: 'admin_roles.read',
        match: (pathname) => pathname.startsWith('/access-roles'),
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Аналітика',
    icon: ChartColumn,
    items: [
      {
        href: '/analytics/users',
        label: 'Користувачі',
        icon: UsersRound,
        permission: 'analytics.read',
        match: (pathname) => pathname.startsWith('/analytics/users') || pathname.startsWith('/users/activity'),
      },
    ],
  },
  {
    id: 'site',
    label: 'Сайт',
    icon: PanelsTopLeft,
    items: [
      {
        href: '/pages',
        label: 'Сторінки',
        icon: Files,
        permission: 'pages.read',
        match: (pathname) => pathname.startsWith('/pages'),
      },
      {
        href: '/tariffs',
        label: 'Тарифи',
        icon: Ticket,
        permission: 'tariffs.read',
        match: (pathname) => pathname.startsWith('/tariffs'),
      },
      {
        href: '/blocks',
        label: 'Блоки',
        icon: LayoutTemplate,
        permission: 'blocks.read',
        match: (pathname) => pathname.startsWith('/blocks'),
      },
      {
        href: '/faq',
        label: 'FAQ',
        icon: CircleHelp,
        permission: 'faqs.read',
        match: (pathname) => pathname.startsWith('/faq'),
      },
    ],
  },
  {
    id: 'leads',
    label: 'Заявки',
    icon: Inbox,
    items: [
      {
        href: '/leads',
        label: 'Усі заявки',
        icon: Mail,
        permission: 'leads.read',
        match: (pathname) => pathname === '/leads' || /^\/leads\/\d+$/.test(pathname),
      },
      {
        href: '/leads/categories',
        label: 'Категорії',
        icon: Tags,
        permission: 'leads.read',
        match: (pathname) => pathname.startsWith('/leads/categories'),
      },
    ],
  },
  {
    id: 'media',
    label: 'Медіа',
    icon: Shapes,
    items: [
      {
        href: '/icons',
        label: 'Іконки',
        icon: Shapes,
        permission: 'icons.read',
        match: (pathname) => pathname === '/icons' || /^\/icons\/\d+$/.test(pathname),
      },
      {
        href: '/images',
        label: 'Зображення',
        icon: ImageIcon,
        permission: 'icons.read',
        match: (pathname) => pathname === '/images' || /^\/images\/\d+$/.test(pathname),
      },
      {
        href: '/videos',
        label: 'Відео',
        icon: Video,
        permission: 'icons.read',
        match: (pathname) => pathname === '/videos' || /^\/videos\/\d+$/.test(pathname),
      },
      {
        href: '/icons/groups',
        label: 'Групи',
        icon: FolderOpen,
        permission: 'icons.read',
        match: (pathname) => pathname.startsWith('/icons/groups'),
      },
    ],
  },
  {
    id: 'content',
    label: 'Контент',
    icon: Boxes,
    items: [
      {
        href: '/about-stats',
        label: 'Цифри',
        icon: Hash,
        permission: 'about_stats.read',
        match: (pathname) => pathname.startsWith('/about-stats'),
      },
      {
        href: '/formats',
        label: 'Формати',
        icon: Layers,
        permission: 'formats.read',
        match: (pathname) => pathname.startsWith('/formats'),
      },
      {
        href: '/rules',
        label: 'Правила',
        icon: ClipboardList,
        permission: 'rules.read',
        match: (pathname) => pathname.startsWith('/rules'),
      },
      {
        href: '/reviews',
        label: 'Відгуки',
        icon: MessageSquareQuote,
        permission: 'reviews.read',
        match: (pathname) => pathname.startsWith('/reviews'),
      },
    ],
  },
  {
    id: 'curriculum',
    label: 'Матеріали',
    icon: GraduationCap,
    items: [
      {
        href: '/materials/lessons',
        label: 'Уроки',
        icon: BookOpen,
        permission: 'curriculum.read',
        match: (pathname) => pathname === '/materials/lessons' || pathname.startsWith('/materials/lessons/'),
      },
      {
        href: '/materials/units',
        label: 'Юніти',
        icon: Layers,
        permission: 'curriculum.read',
        match: (pathname) => pathname === '/materials/units' || pathname.startsWith('/materials/units/'),
      },
      {
        href: '/materials/courses',
        label: 'Курси',
        icon: Library,
        permission: 'curriculum.read',
        match: (pathname) => pathname === '/materials/courses' || pathname.startsWith('/materials/courses/'),
      },
      {
        href: '/materials/levels',
        label: 'Рівні',
        icon: Hash,
        permission: 'curriculum.read',
        match: (pathname) => pathname === '/materials/levels' || pathname.startsWith('/materials/levels/'),
      },
      {
        href: '/materials/tests',
        label: 'Тести',
        icon: ClipboardCheck,
        permission: ['tests.read', 'curriculum.read'],
        match: (pathname) => pathname === '/materials/tests' || pathname.startsWith('/materials/tests/'),
      },
      {
        href: '/materials/access',
        label: 'Доступи',
        icon: KeyRound,
        permission: 'curriculum.write',
        match: (pathname) => pathname.startsWith('/materials/access'),
      },
    ],
  },
  {
    id: 'modules',
    label: 'Модулі',
    icon: Boxes,
    items: [
      {
        href: '/modules/mailings',
        label: 'Розсилки',
        icon: Mail,
        match: (pathname) => pathname.startsWith('/modules/mailings'),
      },
    ],
  },
];

export function filterNav(user: User | null) {
  return nav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permission) return true;
        const keys = Array.isArray(item.permission) ? item.permission : [item.permission];
        return keys.some((key) => hasPermission(user, key));
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function groupHasActive(group: NavGroup, pathname: string, search: string) {
  return group.items.some((item) => item.match(pathname, search));
}
