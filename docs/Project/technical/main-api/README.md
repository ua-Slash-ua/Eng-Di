# MainApi — повний технічний довідник

← [Технічна](../README.md) · [Головна](../../README.md)

**Base URL:** `/api` · **Static:** `/uploads` · **~180 endpoints · 29 controllers · 29 services**

## Зміст

| # | Файл | Модулі |
|---|------|--------|
| 0 | [00-core.md](./00-core.md) | main.ts, app.module, health, prisma, common, guards |
| 1 | [01-auth.md](./01-auth.md) | auth, sessions, cookies, permissions |
| 2 | [02-users-admin.md](./02-users-admin.md) | users, admin, admin-roles, class |
| 3 | [03-pages-blocks.md](./03-pages-blocks.md) | pages, blocks |
| 4 | [04-content-public.md](./04-content-public.md) | public API + UserPanel SSR loaders |
| 5 | [05-curriculum.md](./05-curriculum.md) | curriculum, teacher-library, presentations, chain |
| 6 | [06-lessons-schedule.md](./06-lessons-schedule.md) | lessons, schedule |
| 7 | [07-tests.md](./07-tests.md) | tests |
| 8 | [08-tariffs.md](./08-tariffs.md) | tariffs, user-tariffs |
| 9 | [09-mailings.md](./09-mailings.md) | mailings, cron, SMTP |
| 10 | [10-settings.md](./10-settings.md) | settings (media, branding, contacts, mailings) |
| 11 | [11-cms-entities.md](./11-cms-entities.md) | faqs, formats, rules, reviews, leads, about-stats, icons, tariffs |
| 12 | [12-database-startup.md](./12-database-startup.md) | migrations, seeds |
| — | [api-index.md](./api-index.md) | Повний алфавітний індекс усіх endpoint |

## Швидка карта модулів

```
MainApi/src/
├── auth/              JWT, sessions, guards, permissions
├── users/             User CRUD, teacher↔students
├── admin/             Dashboard stats, user admin
├── admin-roles/       RBAC
├── pages/             CMS pages + sections
├── blocks/            Reusable blocks
├── content/           Public read API
├── curriculum/        Levels→Lessons, grants, library
├── lessons/           Scheduled lessons (tariff)
├── schedule/          Work/busy calendar rules
├── tests/             Tests, attempts, grants
├── tariffs/           Tariff plans + subscriptions
├── mailings/          Email queue + cron
├── settings/          Key-value settings
├── faqs/ formats/ rules/ reviews/ leads/ about-stats/ icons/
├── database/startup/  Migrations + seeds
└── prisma/            PrismaService
```
