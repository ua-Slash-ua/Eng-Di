export type PermissionDef = {
  key: string;
  resource: string;
  action: string;
  label: string;
  groupLabel: string;
};

export const PERMISSION_CATALOG: PermissionDef[] = [
  { key: 'dashboard.read', resource: 'dashboard', action: 'read', label: 'Перегляд дашборду', groupLabel: 'Огляд' },
  { key: 'settings.read', resource: 'settings', action: 'read', label: 'Перегляд налаштувань', groupLabel: 'Налаштування' },
  { key: 'settings.write', resource: 'settings', action: 'write', label: 'Редагування налаштувань', groupLabel: 'Налаштування' },
  { key: 'users.read', resource: 'users', action: 'read', label: 'Перегляд користувачів', groupLabel: 'Користувачі' },
  { key: 'users.write', resource: 'users', action: 'write', label: 'Редагування користувачів', groupLabel: 'Користувачі' },
  { key: 'users.delete', resource: 'users', action: 'delete', label: 'Видалення користувачів', groupLabel: 'Користувачі' },
  { key: 'analytics.read', resource: 'analytics', action: 'read', label: 'Перегляд аналітики', groupLabel: 'Аналітика' },
  { key: 'auth.read', resource: 'auth', action: 'read', label: 'Перегляд сесій і подій', groupLabel: 'Аналітика' },
  { key: 'pages.read', resource: 'pages', action: 'read', label: 'Перегляд сторінок', groupLabel: 'Контент' },
  { key: 'pages.write', resource: 'pages', action: 'write', label: 'Редагування сторінок', groupLabel: 'Контент' },
  { key: 'pages.delete', resource: 'pages', action: 'delete', label: 'Видалення сторінок', groupLabel: 'Контент' },
  { key: 'blocks.read', resource: 'blocks', action: 'read', label: 'Перегляд блоків', groupLabel: 'Контент' },
  { key: 'blocks.write', resource: 'blocks', action: 'write', label: 'Редагування блоків', groupLabel: 'Контент' },
  { key: 'blocks.delete', resource: 'blocks', action: 'delete', label: 'Видалення блоків', groupLabel: 'Контент' },
  { key: 'icons.read', resource: 'icons', action: 'read', label: 'Перегляд іконок', groupLabel: 'Контент' },
  { key: 'icons.write', resource: 'icons', action: 'write', label: 'Редагування іконок', groupLabel: 'Контент' },
  { key: 'icons.delete', resource: 'icons', action: 'delete', label: 'Видалення іконок', groupLabel: 'Контент' },
  { key: 'about_stats.read', resource: 'about_stats', action: 'read', label: 'Перегляд статистики', groupLabel: 'Контент' },
  { key: 'about_stats.write', resource: 'about_stats', action: 'write', label: 'Редагування статистики', groupLabel: 'Контент' },
  { key: 'about_stats.delete', resource: 'about_stats', action: 'delete', label: 'Видалення статистики', groupLabel: 'Контент' },
  { key: 'formats.read', resource: 'formats', action: 'read', label: 'Перегляд форматів', groupLabel: 'Контент' },
  { key: 'formats.write', resource: 'formats', action: 'write', label: 'Редагування форматів', groupLabel: 'Контент' },
  { key: 'formats.delete', resource: 'formats', action: 'delete', label: 'Видалення форматів', groupLabel: 'Контент' },
  { key: 'tariffs.read', resource: 'tariffs', action: 'read', label: 'Перегляд тарифів', groupLabel: 'Тарифи' },
  { key: 'tariffs.write', resource: 'tariffs', action: 'write', label: 'Редагування тарифів', groupLabel: 'Тарифи' },
  { key: 'tariffs.delete', resource: 'tariffs', action: 'delete', label: 'Видалення тарифів', groupLabel: 'Тарифи' },
  { key: 'rules.read', resource: 'rules', action: 'read', label: 'Перегляд правил', groupLabel: 'Контент' },
  { key: 'rules.write', resource: 'rules', action: 'write', label: 'Редагування правил', groupLabel: 'Контент' },
  { key: 'rules.delete', resource: 'rules', action: 'delete', label: 'Видалення правил', groupLabel: 'Контент' },
  { key: 'reviews.read', resource: 'reviews', action: 'read', label: 'Перегляд відгуків', groupLabel: 'Контент' },
  { key: 'reviews.write', resource: 'reviews', action: 'write', label: 'Редагування відгуків', groupLabel: 'Контент' },
  { key: 'reviews.delete', resource: 'reviews', action: 'delete', label: 'Видалення відгуків', groupLabel: 'Контент' },
  { key: 'faqs.read', resource: 'faqs', action: 'read', label: 'Перегляд FAQ', groupLabel: 'Контент' },
  { key: 'faqs.write', resource: 'faqs', action: 'write', label: 'Редагування FAQ', groupLabel: 'Контент' },
  { key: 'faqs.delete', resource: 'faqs', action: 'delete', label: 'Видалення FAQ', groupLabel: 'Контент' },
  { key: 'leads.read', resource: 'leads', action: 'read', label: 'Перегляд лідів', groupLabel: 'Ліди' },
  { key: 'leads.write', resource: 'leads', action: 'write', label: 'Редагування лідів', groupLabel: 'Ліди' },
  { key: 'admin_roles.read', resource: 'admin_roles', action: 'read', label: 'Перегляд ролей доступу', groupLabel: 'Ролі доступу' },
  { key: 'admin_roles.write', resource: 'admin_roles', action: 'write', label: 'Керування ролями доступу', groupLabel: 'Ролі доступу' },
  { key: 'curriculum.read', resource: 'curriculum', action: 'read', label: 'Перегляд матеріалів', groupLabel: 'Матеріали' },
  { key: 'curriculum.write', resource: 'curriculum', action: 'write', label: 'Редагування матеріалів', groupLabel: 'Матеріали' },
  { key: 'curriculum.delete', resource: 'curriculum', action: 'delete', label: 'Видалення матеріалів', groupLabel: 'Матеріали' },
  { key: 'tests.read', resource: 'tests', action: 'read', label: 'Перегляд тестів', groupLabel: 'Тести' },
  { key: 'tests.write', resource: 'tests', action: 'write', label: 'Редагування тестів', groupLabel: 'Тести' },
  { key: 'tests.delete', resource: 'tests', action: 'delete', label: 'Видалення тестів', groupLabel: 'Тести' },
];

export const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map((p) => p.key);

export const READ_ONLY_PERMISSION_KEYS = PERMISSION_CATALOG.filter((p) => p.action === 'read').map((p) => p.key);

export const CONTENT_WRITE_KEYS = PERMISSION_CATALOG.filter(
  (p) =>
    ['pages', 'blocks', 'icons', 'about_stats', 'formats', 'tariffs', 'rules', 'reviews', 'faqs'].includes(
      p.resource,
    ) && (p.action === 'read' || p.action === 'write' || p.action === 'delete'),
).map((p) => p.key);

export const MANAGER_PERMISSION_KEYS = [
  'dashboard.read',
  'users.read',
  'users.write',
  'analytics.read',
  'auth.read',
  'leads.read',
  'leads.write',
];
