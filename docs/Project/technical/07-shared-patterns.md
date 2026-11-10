# 07. Спільні патерни

← [Технічна](./README.md) · [Головна](../README.md)

## API Proxy (Next.js → NestJS)

Обидві панелі мають `src/app/api/[...path]/route.ts`:

1. Браузер робить `fetch('/api/admin/users')` — same origin
2. Next.js proxy пересилає на `MAIN_API_URL/api/admin/users`
3. Cookies access/refresh передаються автоматично
4. Response повертається клієнту

**Чому так:** cookies прив'язані до домену панелі (admin.eng-di.com), а API на api.eng-di.com — proxy уникає cross-origin cookie проблем.

Env:

| Panel | Client | SSR (UserPanel home) |
|-------|--------|----------------------|
| AdminPanel | `MAIN_API_URL` | — |
| UserPanel | `MAIN_API_URL` | `API_INTERNAL_URL` |

## X-EngDi-Panel

Обов'язковий заголовок на всі auth/API запити:

- AdminPanel: `admin`
- UserPanel: `user`

MainApi `request-context.ts` читає panel для вибору cookie names і перевірки guard.

## Client API helper

Обидва `lib/api.ts` ідентичні за патерном:

```typescript
export async function api<T>(path: string, options?: RequestInit): Promise<T>
```

- `credentials: 'include'`
- Auto refresh на 401 (крім login/logout paths)
- `onUnauthorized(handler)` — redirect на login
- Помилки: `throw new Error(data.error)`

## Uploads

| Джерело | Шлях на диску | URL |
|---------|---------------|-----|
| Avatars | `uploads/avatars/` | `/uploads/avatars/...` |
| Presentations | `uploads/presentations/` | `/uploads/presentations/...` |
| Icons/media | `uploads/icons/` etc. | `/uploads/...` |

MainApi `main.ts`: `app.useStaticAssets('uploads')`.

FormData upload — без `Content-Type: application/json` (api helper це враховує).

## CORS

MainApi дозволяє origins:

- `USER_PANEL_ORIGIN`
- `ADMIN_PANEL_ORIGIN`

Credentials: true (для direct API calls у dev).

## Pagination / sorting (API)

Спільні DTO в `common/`:

- `list-query.dto.ts` — page, limit, search
- `pagination.ts` — skip/take helpers
- `sorting.ts` — orderBy builder
- `filters.ts` — filter parsing

Admin lists використовують однакові query params.

## Startup pipeline

`database/startup/runStartup.ts`:

```
runMigrations() → runSeeds()
```

- **Migrations** — idempotent DDL (ALTER TABLE IF NOT EXISTS pattern)
- **Seeds** — demo data, super admin, permissions catalog sync

Запускається при кожному boot API — безпечно для prod (migrations перевіряють стан).

## Prisma module

`PrismaModule` — global, inject `PrismaService` у всі сервіси.

Build: `prisma generate` перед `nest build`.

## Email (MailingsMailerService)

SMTP з Settings (key-value). Використовується:

- Password reset
- Lesson reminders (cron)
- Manual mailings (admin module)

## Cron (@nestjs/schedule)

MailingsModule — scheduled jobs:

- Scan upcoming lessons → enqueue reminder tasks
- Process mailing queue
- Bounce / overdue handling

## Error responses

NestJS exceptions → JSON `{ statusCode, message, error }`.

Frontend `api()` показує `data.error` або fallback «Помилка запиту».

## Feature module pattern (AdminPanel)

```
features/foo/
  api.ts       — api<Foo>('/api/admin/foo')
  types.ts     — interfaces
  components/  — *ListView, *EditView
app/(panel)/foo/page.tsx — thin wrapper
```

## Feature module pattern (UserPanel)

```
features/cabinet/bar/
  api.ts
  *View.tsx
app/cabinet/.../bar/page.tsx
```

## Dirty form protection

AdminPanel `useDirtyForm` — beforeunload + confirm при navigate away.

## Select with search

AdminPanel `Select.tsx`:

- prop `searchable` — input filter по label/hint
- Використовується в TestEditView для вибору матеріалу

## Production deploy checklist

1. `npm run build` у кожному проєкті
2. Upload повного `.next` + `public` + `package.json`
3. Restart Node process
4. MainApi: `.env`, `uploads/` writable
5. Перевірити `GET /api/health`

## Dev ports (typical)

| Service | Port |
|---------|------|
| UserPanel | 3000 |
| AdminPanel | 3001 |
| MainApi | 4000 |
