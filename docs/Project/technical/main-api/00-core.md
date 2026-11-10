# MainApi — Core

← [MainApi](./README.md)

## `src/main.ts`

Точка входу NestJS.

| Крок | Що робить |
|------|-----------|
| Bootstrap | `NestFactory.create(AppModule)` |
| Prefix | `app.setGlobalPrefix('api')` |
| CORS | Origins з env: `USER_PANEL_ORIGIN`, `ADMIN_PANEL_ORIGIN`, `CORS_ORIGINS` |
| Validation | Global `ValidationPipe`: whitelist, transform, forbidNonWhitelisted |
| Errors | Global `HttpErrorFilter` → `{ error: string }` |
| Static | `express.static('uploads')` на `/uploads` |
| Listen | `0.0.0.0:4000` (dev) |

## `src/app.module.ts`

Імпортує всі feature modules + `CronScheduleModule`, `ConfigModule`, `PrismaModule`.

## `src/health.controller.ts`

```
GET /api/health → { ok: true, service: 'MainApi' }
```

Без auth. Використовується для health checks на hosting.

## `src/http-error.filter.ts`

Перехоплює `HttpException`, нормалізує відповідь до `{ error: message }`.

---

## `prisma/`

### `prisma.module.ts`
- `@Global()` — доступний у всіх модулях
- Exports: `PrismaService`

### `prisma.service.ts`

| Метод | Призначення |
|-------|-------------|
| `onModuleInit()` | `await $connect()`, потім `runStartup()` |

Extends `PrismaClient` — усі моделі schema доступні через `this.prisma.*`.

---

## `common/`

### `dto/list-query.dto.ts` — `ListQueryDto`

| Поле | Тип | Default | Опис |
|------|-----|---------|------|
| `q` | string? | — | Full-text search |
| `sort` | string? | — | Поле сортування |
| `order` | `'asc'\|'desc'`? | — | Напрямок |
| `page` | number? | 1 | Сторінка |
| `limit` | number? | 20 | Розмір сторінки |

### `pagination.ts`
Helpers: `skip`, `take`, `paginateResult` — стандартна пагінація для admin lists.

### `sorting.ts`
`resolveSort(query, allowedFields)` — безпечний orderBy для Prisma.

### `filters.ts`
Парсинг column filters з query string (admin tables).

---

## Guards (глобальний довідник)

| Guard | Файл | Логіка |
|-------|------|--------|
| `JwtAuthGuard` | `auth/jwt-auth.guard.ts` | Passport JWT strategy; access token з cookie або Bearer |
| `OptionalJwtAuthGuard` | `auth/optional-jwt-auth.guard.ts` | JWT опційний — attach user якщо є |
| `AdminPanelGuard` | `auth/admin-panel.guard.ts` | `hasAdminPanelAccess(user)` |
| `UserPanelGuard` | `auth/user-panel.guard.ts` | `hasUserPanelAccess(user)` — student або teacher |
| `PermissionsGuard` | `auth/permissions.guard.ts` | `@Permissions('a','b')` — OR логіка; superAdmin bypass |
| `RolesGuard` | `auth/roles.guard.ts` | `@Roles('super_admin')` / `@SuperAdminOnly()` |

## Decorators

| Decorator | Файл | Опис |
|-----------|------|------|
| `@Permissions(...keys)` | `permissions.decorator.ts` | Metadata для PermissionsGuard |
| `@Roles(...)` | `roles.decorator.ts` | Metadata для RolesGuard |
| `@SuperAdminOnly()` | `roles.decorator.ts` | Shorthand для super_admin |

## Request context (`auth/request-context.ts`)

| Export | Опис |
|--------|------|
| `AuthPanel` | `'user' \| 'admin'` |
| `getRequestIp(req)` | X-Forwarded-For / socket IP |
| `getUserAgent(req)` | User-Agent header |
| `getRequestPanel(req)` | З заголовка `X-EngDi-Panel` |

## Cookies (`auth/cookies.ts`)

| Cookie | Admin | User |
|--------|-------|------|
| Access | `engdi_admin_access` | `engdi_user_access` |
| Refresh | `engdi_admin_refresh` | `engdi_user_refresh` |

Legacy (deprecated): `engdi_access`, `engdi_refresh`.

| Function | Опис |
|----------|------|
| `accessCookieName(panel)` | Ім'я access cookie |
| `refreshCookieName(panel)` | Ім'я refresh cookie |
| `readAccessToken(req, panel)` | Cookie або Authorization Bearer |
| `readRefreshToken(req, panel)` | Refresh з cookie |

## JWT payload (`auth/access-payload.ts`)

```typescript
type AccessPayload = { userId: number; sid: number; typ: 'access' }
```

- `userId` — ID користувача
- `sid` — session ID (AuthSession)
- `typ` — завжди `'access'`

## Duration parser (`auth/duration.ts`)

`parseDurationMs('15m' | '30d' | ...)` — для JWT TTL config.

## Login rate limit (`auth/login-rate-limit.ts`)

In-memory rate limit per `IP|email` — блокує brute force login.
