# 02. MainApi

← [Технічна](./README.md) · [Головна](../README.md)

## Точка входу

- `src/main.ts` — Nest bootstrap, global prefix `api`, CORS, static `/uploads`.
- `src/app.module.ts` — реєстрація всіх модулів.

## Модулі та сервіси

### AuthModule
| Файл | Призначення |
|------|-------------|
| `auth.service.ts` | login, refresh, profile, password |
| `sessions.service.ts` | Refresh tokens, rotation, revoke |
| `jwt.strategy.ts` | Passport JWT з cookie/header |
| `admin-panel.guard.ts` | Доступ лише admin/superAdmin |
| `user-panel.guard.ts` | Доступ student/teacher |
| `permissions.guard.ts` | Перевірка `@Permissions()` (OR логіка) |
| `auth.controller.ts` | `/api/auth/*` |

### CurriculumModule
| Сервіс | Методи / логіка |
|--------|-----------------|
| `curriculum.service.ts` | CRUD levels/courses/units/lessons, `grantAccess`, `revokeAccess` |
| `teacher-library.service.ts` | `getLibrary`, `getContentDetail`, fork/update own lessons |
| `lesson-presentations.service.ts` | Upload PDF/PPTX, `resolveScheduledMaterial` |
| `content-chain.service.ts` | `buildAccessChain` — lesson→unit→course→level |

**Controllers:** `admin-curriculum.controller.ts`, `teacher-library.controller.ts`

### LessonsModule
| Сервіс | Призначення |
|--------|-------------|
| `lessons.service.ts` | `board`, `show`, `propose`, `accept`, `freeze`, `assignContent`, `linkedTests` |

**Endpoints:** `/api/cabinet/lessons/*`, `/api/admin/users/:id/lessons/*`

### TestsModule
| Сервіс | Призначення |
|--------|-------------|
| `tests.service.ts` | CRUD, `unlock`, `startAttempt`, `submitAttempt`, `listMaterialTestsForChain` |

**Admin:** `/api/admin/tests` · **Cabinet:** `/api/cabinet/tests`

### TariffsModule
- Admin CRUD тарифів, cabinet select/cancel, `UserTariffsService` — підписки учнів.

### MailingsModule
- `MailingsMailerService` — SMTP send.
- `MailingTasksService` — черга задач.
- Cron jobs: нагадування про уроки, bounce handling.

### ContentModule (public)
`public-content.controller.ts` — read-only для лендингу без auth.

## Guards stack (типовий admin endpoint)

```
JwtAuthGuard → AdminPanelGuard → PermissionsGuard
```

Cabinet:

```
JwtAuthGuard → UserPanelGuard → (RolesGuard за потреби)
```

## Startup

`database/startup/runStartup.ts` — при boot:

1. Migrations (DDL patches).
2. Seeds (admin, roles, demo content).

## Uploads

Файли на диску: `MainApi/uploads/` — presentations, avatars, icons, media.

URL у відповідях API: `/uploads/...` — віддається через `express.static` у `main.ts`.

## Health

`GET /api/health` — перевірка живучості API.

## Повний перелік admin prefix

```
/api/admin/users
/api/admin/admin-roles
/api/admin/pages
/api/admin/blocks
/api/admin/tariffs
/api/admin/curriculum/*
/api/admin/tests/*
/api/admin/settings/*
/api/admin/mailings/*
/api/admin/reviews
/api/admin/faqs
/api/admin/rules
/api/admin/formats
/api/admin/about-stats
/api/admin/leads
/api/admin/icons
/api/admin/auth/*
```

## Повний перелік cabinet prefix

```
/api/cabinet/lessons
/api/cabinet/schedule
/api/cabinet/tariffs
/api/cabinet/class
/api/cabinet/reviews
/api/cabinet/library/*
/api/cabinet/tests/*
```

Логіка роботи — у [logical/](../logical/README.md) розділах.
