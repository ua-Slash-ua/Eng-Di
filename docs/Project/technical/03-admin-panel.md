# 03. AdminPanel

← [Технічна](./README.md) · [Головна](../README.md)

## Стек і роль

**AdminPanel** — Next.js 15 App Router, React 19. Це фронтенд для адміністраторів школи. Усі дані йдуть через проксі `/api/*` на MainApi з заголовком `X-EngDi-Panel: admin`.

## Структура каталогів

```
AdminPanel/src/
├── app/
│   ├── login/              — сторінка входу
│   ├── api/[...path]/      — proxy до MainApi
│   └── (panel)/            — захищена зона з AdminShell
├── features/               — доменні модулі (users, curriculum, tests…)
├── components/             — спільні UI-компоненти
├── hooks/                  — useDirtyForm, usePaginatedList, useTableQuery
└── lib/                    — api, auth, nav, permissions, format
```

## Маршрути `(panel)/`

| Шлях | Компонент / фіча | Permission |
|------|------------------|------------|
| `/` | Dashboard | `dashboard.read` |
| `/settings` | SettingsView | `settings.read` |
| `/users` | UsersListView | `users.read` |
| `/users?role=student\|teacher\|admin,super_admin` | Фільтр по ролях | `users.read` |
| `/users/[id]` | UserEditView + UserMaterialsPanel | `users.read` |
| `/users/activity` | Auth events | `analytics.read` |
| `/access-roles` | Admin roles list | `admin_roles.read` |
| `/access-roles/[id]` | Role edit | `admin_roles.write` |
| `/analytics/users` | User analytics | `analytics.read` |
| `/pages`, `/pages/[id]`, `/pages/new` | CMS pages | `pages.*` |
| `/blocks`, `/blocks/[id]` | Reusable blocks | `blocks.*` |
| `/tariffs`, `/tariffs/[id]` | Tariff CRUD | `tariffs.*` |
| `/faq`, `/faq/[id]` | FAQ | `faqs.*` |
| `/leads`, `/leads/[id]` | Leads inbox | `leads.*` |
| `/leads/categories` | Lead categories | `leads.read` |
| `/icons`, `/images`, `/videos` | Media library | `icons.*` |
| `/icons/groups` | Icon groups | `icons.*` |
| `/about-stats` | About section stats | `about_stats.*` |
| `/formats` | Learning formats | `formats.*` |
| `/rules` | School rules | `rules.*` |
| `/reviews` | Reviews | `reviews.*` |
| `/materials/levels\|courses\|units\|lessons` | Curriculum CRUD | `curriculum.*` |
| `/materials/tests` | Tests list + edit | `tests.read` OR `curriculum.read` |
| `/materials/access` | AccessGrantView | `curriculum.write` |
| `/modules/mailings` | Mailings module | без permission (поки відкрито) |

Навігація зібрана в `lib/nav.ts` — групи **Огляд**, **Користувачі**, **Аналітика**, **Сайт**, **Заявки**, **Медіа**, **Контент**, **Матеріали**, **Модулі**. Функція `filterNav(user)` ховає пункти без відповідного permission.

## Features (доменні модулі)

Кожна фіча зазвичай має:

- `api.ts` — typed fetch-обгортки над `/api/admin/...`
- `types.ts` — TypeScript типи відповідей
- `components/` — списки, форми редагування

### users

| Файл | Призначення |
|------|-------------|
| `UserEditView.tsx` | Редагування профілю, ролі, teacherId, adminRole, статус |
| `UserMaterialsPanel.tsx` | Доступ вчителя до матеріалів з картки користувача |
| `UsersListView.tsx` | Таблиця з фільтрами, пагінацією |

### curriculum

| Файл | Призначення |
|------|-------------|
| `CurriculumView.tsx` | Спільний список для levels/courses/units/lessons |
| `ContentLevelEditView.tsx` … `ContentLessonEditView.tsx` | CRUD сутностей |
| `LessonPresentationField.tsx` | Upload презентації до уроку |
| `AccessGrantView.tsx` | Дерево grant/revoke доступів вчителю |
| `grantTree.ts` | Побудова дерева матеріалів для UI |

### tests

| Файл | Призначення |
|------|-------------|
| `TestsListView.tsx` | Список тестів (free / material) |
| `TestEditView.tsx` | Редагування тесту, питань, опцій; searchable select матеріалу |

### blocks

Блоки для секцій головної: `HeroBlockFields`, `FormatsBlockFields`, `LevelsBlockFields`, `ReviewsBlockFields` — поля прив'язані до типів блоків у CMS.

### settings

`SettingsView.tsx` — брендинг, контакти, SMTP, presentation limits, media settings.

## Спільні компоненти (`components/`)

| Компонент | Призначення |
|-----------|-------------|
| `ui/Select.tsx` | Dropdown; prop `searchable` — поле пошуку в списку |
| `ui/MultiSelect.tsx` | Множинний вибір |
| `ui/DataTable.tsx` | Таблиця з сортуванням |
| `ui/ColumnFilterCell.tsx` | Фільтр колонки |
| `ui/RecordActionsMenu.tsx` | Меню дій над записом |
| `fields/RepeaterField.tsx` | Повторювані поля (FAQ, options) |

## Lib

| Файл | Призначення |
|------|-------------|
| `lib/api.ts` | `api<T>(path)` — fetch з auto-refresh JWT, `X-EngDi-Panel: admin` |
| `lib/auth.tsx` | AuthProvider, useAuth, redirect на login |
| `lib/permissions.ts` | `hasPermission`, тип User з adminRole.permissions |
| `lib/nav.ts` | Sidebar navigation |
| `lib/pagination.ts` | Query params для списків |

## Hooks

| Hook | Призначення |
|------|-------------|
| `useDirtyForm` | Попередження при незбережених змінах |
| `usePaginatedList` | Список з page/limit/search |
| `useTableQuery` | URL-sync для таблиць |

## Shell

- `features/shell/AdminShell.tsx` — layout: sidebar + topbar + content
- `getTopbarTitle.ts` — заголовок за pathname

## Proxy (`app/api/[...path]/route.ts`)

Проксує запити на `MAIN_API_URL`, передає cookies і заголовки. Дозволяє same-origin cookies для admin-домену.

## Dev

```bash
cd AdminPanel
npm run dev   # порт 3001
```

Env: `MAIN_API_URL=http://127.0.0.1:4000` (або production internal URL).

## Зв'язок з логікою

Бізнес-процеси описані в [logical/](../logical/README.md). Технічні API — у [02-main-api.md](./02-main-api.md).
