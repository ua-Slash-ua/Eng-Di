# EngDi — документація проєкту

Повна технічна та логічна документація монорепозиторію **EngDi**.

## Як користуватися

1. Відкрийте цей файл у **Cursor / VS Code** — натисніть `Ctrl+Shift+V` (Preview).
2. Клікайте по посиланнях — навігація між розділами.
3. **Технічна** — код, API, файли, типи, функції.
4. **Логічна** — бізнес-процеси, ролі, сценарії використання.

## Структура репозиторію

```
EngDi/
├── MainApi/       — NestJS REST API, Prisma, MySQL
├── AdminPanel/    — Next.js 15, адмін-кабінет
├── UserPanel/     — Next.js 15, сайт + кабінет
└── docs/Project/  — ця документація
```

---

## Технічна документація

### Огляд

| Документ | Зміст |
|----------|--------|
| [01-overview](./technical/01-overview.md) | Архітектура, деплой, env |
| [05-database (огляд)](./technical/05-database.md) | Prisma, enum, ER |
| [06-auth-permissions](./technical/06-auth-permissions.md) | JWT, RBAC |
| [07-shared-patterns](./technical/07-shared-patterns.md) | Proxy, uploads, cron |

### MainApi (детально)

→ **[technical/main-api/README.md](./technical/main-api/README.md)**

| Файл | Модуль |
|------|--------|
| [00-core](./technical/main-api/00-core.md) | main, prisma, guards, common |
| [01-auth](./technical/main-api/01-auth.md) | Auth, sessions, permissions |
| [02-users-admin](./technical/main-api/02-users-admin.md) | Users, admin, roles, class |
| [03-pages-blocks](./technical/main-api/03-pages-blocks.md) | CMS pages & blocks |
| [05-curriculum](./technical/main-api/05-curriculum.md) | Materials, library, presentations |
| [06-lessons-schedule](./technical/main-api/06-lessons-schedule.md) | Lessons, schedule |
| [07-tests](./technical/main-api/07-tests.md) | Tests, attempts, grants |
| [11-cms-entities](./technical/main-api/11-cms-entities.md) | Tariffs, mailings, settings, FAQ… |
| [12-database-startup](./technical/main-api/12-database-startup.md) | Migrations & seeds |
| [**api-index**](./technical/main-api/api-index.md) | **~180 endpoints** |

### AdminPanel (детально)

→ **[technical/admin-panel/README.md](./technical/admin-panel/README.md)**

| Файл | Зміст |
|------|--------|
| [routes](./technical/admin-panel/routes.md) | 51 маршрут |
| [features](./technical/admin-panel/features.md) | 18 feature modules |
| [components-lib](./technical/admin-panel/components-lib.md) | UI, hooks, lib |

### UserPanel (детально)

→ **[technical/user-panel/README.md](./technical/user-panel/README.md)**

| Файл | Зміст |
|------|--------|
| [routes](./technical/user-panel/routes.md) | Маршрути + layouts |
| [features](./technical/user-panel/features.md) | auth, home, cabinet, tests |
| [lib-components](./technical/user-panel/lib-components.md) | lib, components |

### База даних (поля)

→ **[database/models.md](./database/models.md)** — кожна модель, кожне поле

---

## Логічна документація

| # | Документ | Зміст |
|---|----------|--------|
| 1 | [Користувачі та доступ](./logical/01-users-auth.md) | Ролі, логін, RBAC, сценарії |
| 2 | [Контент сайту](./logical/02-site-content.md) | CMS, лендинг, заявки |
| 3 | [Матеріали](./logical/03-curriculum.md) | Curriculum, grants, fork |
| 4 | [Заняття та розклад](./logical/04-lessons-schedule.md) | Lifecycle, календар |
| 5 | [Тести](./logical/05-tests.md) | Free/material, unlock, спроби |
| 6 | [Тарифи](./logical/06-tariffs.md) | Пакети, підписки |
| 7 | [Презентації](./logical/07-presentations.md) | PDF/PPTX upload |
| 8 | [Розсилки](./logical/08-mailings.md) | Email, cron |

---

## Швидкі посилання

| Середовище | URL (prod) | Dev |
|------------|------------|-----|
| Сайт | https://www.eng-di.com | http://localhost:3000 |
| Адмінка | https://admin.eng-di.com | http://localhost:3001 |
| API | https://api.eng-di.com | http://localhost:4000 |

## Статистика кодової бази

| Проєкт | Controllers / Routes | Feature modules |
|--------|---------------------|-----------------|
| MainApi | ~29 controllers, ~180 endpoints | 24 modules |
| AdminPanel | 51 pages | 18 features |
| UserPanel | 28 pages | auth, home, cabinet, tests |

## Оновлення

При новій фічі:
1. Доповніть відповідний файл у `technical/main-api/` або `admin-panel/` / `user-panel/`
2. Бізнес-опис — у `logical/`
3. Нові моделі — `database/models.md` + `api-index.md`
