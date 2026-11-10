# 01. Огляд системи

← [Технічна документація](./README.md) · [Головна](../README.md)

## Призначення

**EngDi** — платформа онлайн-школи англійської:

- **Публічний сайт** — лендинг, тарифи, заявки, CMS-контент.
- **Кабінет учня/вчителя** — заняття, розклад, матеріали, тести, відгуки.
- **Адмін-панель** — управління контентом, користувачами, матеріалами, тестами.

## Три проєкти

| Проєкт | Стек | Призначення |
|--------|------|-------------|
| `MainApi/` | NestJS 11, Prisma, MySQL | Єдиний REST API, БД, файли, email |
| `AdminPanel/` | Next.js 15, React 19 | UI для адміністраторів |
| `UserPanel/` | Next.js 15, React 19 | Публічний сайт + user cabinet |

## Потік запитів

```
Браузер (admin / www)
    → Next.js /api/[...path] proxy
    → MainApi /api/*
    → Prisma → MySQL

Статика (uploads, _next)
    → MainApi /uploads або Next static
```

Обидві панелі проксують API через `src/app/api/[...path]/route.ts` на `MAIN_API_URL` (внутрішній bind, не публічний HTTPS).

Заголовок **`X-EngDi-Panel`**: `admin` | `user` — визначає, яка cookie-сесія використовується.

## Структура MainApi (`src/`)

| Каталог | Призначення |
|---------|-------------|
| `auth/` | Login, JWT, sessions, guards, permissions |
| `users/` | CRUD користувачів, class (teacher↔students) |
| `admin/` | Admin stats, user management endpoints |
| `admin-roles/` | RBAC: ролі та permissions |
| `pages/`, `blocks/` | CMS сторінки та блоки |
| `curriculum/` | Рівні, курси, юніти, уроки, бібліотека вчителя |
| `lessons/` | Заняття (scheduled lessons), assign content |
| `schedule/` | Робочий календар вчителя/учня |
| `tariffs/` | Тарифні плани та підписки |
| `tests/` | Тести, спроби, grants |
| `reviews/`, `faqs/`, `rules/`, `formats/` | Контентні сутності |
| `leads/` | Заявки з сайту |
| `icons/` | Медіа-бібліотека (іконки, зображення, відео) |
| `settings/` | Брендинг, контакти, mailings, presentations |
| `mailings/` | Email queue, cron, SMTP |
| `content/` | Публічні read-only endpoints |
| `database/startup/` | Migrations, seeds при старті |
| `prisma/` | Schema + Prisma client |

## Структура AdminPanel (`src/`)

| Каталог | Призначення |
|---------|-------------|
| `app/(panel)/` | Маршрути під `AdminShell` (sidebar + topbar) |
| `app/login/` | Сторінка входу |
| `app/api/` | Proxy до MainApi |
| `features/*/` | Доменна логіка по модулях (users, curriculum, tests…) |
| `components/` | UI: Select, DataTable, Sidebar, fields |
| `lib/` | api, auth, nav, permissions, format |
| `hooks/` | useDirtyForm, useTableQuery, usePaginatedList |

## Структура UserPanel (`src/`)

| Каталог | Призначення |
|---------|-------------|
| `app/(public)/` | Лендинг `/` |
| `app/(auth)/` | login, forgot/reset password |
| `app/cabinet/` | student / teacher layouts |
| `app/materials/tests/` | Проходження тестів |
| `features/home/` | Секції головної (hero, pricing, reviews…) |
| `features/cabinet/` | Lessons, schedule, library, profile |
| `features/tests/` | TakeTestView, LinkedTestsPanel |
| `lib/` | api, auth, roles, CMS loaders |

## Деплой (production)

| App | Host (internal) | Port | Public |
|-----|-----------------|------|--------|
| MainApi | 127.1.6.104 | 3000 | api.eng-di.com |
| AdminPanel | 127.1.9.32 | 3000 | admin.eng-di.com |
| UserPanel | 127.1.9.238 | 3000 | www.eng-di.com |

**Dev:**

| App | Port |
|-----|------|
| MainApi | 4000 |
| AdminPanel | 3001 |
| UserPanel | 3000 |

## Збірка

```bash
cd MainApi && npm run build      # prisma generate + nest build
cd AdminPanel && npm run build   # next build
cd UserPanel && npm run build    # next build
```

На shared hosting збірку Next краще робити локально (OOM / SIGKILL).

## Ключові env

**MainApi:** `DATABASE_URL`, `JWT_SECRET`, `USER_PANEL_ORIGIN`, `ADMIN_PANEL_ORIGIN`, SMTP.

**Panels:** `MAIN_API_URL`, `API_INTERNAL_URL` (UserPanel SSR).

Деталі: [06-auth-permissions.md](./06-auth-permissions.md), [07-shared-patterns.md](./07-shared-patterns.md).
