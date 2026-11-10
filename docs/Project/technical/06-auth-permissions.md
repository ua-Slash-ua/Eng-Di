# 06. Авторизація та permissions

← [Технічна](./README.md) · [Головна](../README.md)

## Два panel-и

Система розділяє сесії **admin** і **user**:

| Panel | Cookie prefix | Хто має доступ |
|-------|---------------|----------------|
| `admin` | `engdi_admin_*` | isSuperAdmin або adminRole |
| `user` | `engdi_user_*` | userRole = student \| teacher |

Заголовок `X-EngDi-Panel` на кожному запиті визначає, які cookies читати.

## JWT flow

1. **Login** — перевірка email/password, bcrypt, rate limit
2. Створення **AuthSession** + refresh token (hash у БД)
3. **Access JWT** (short TTL, ~15m) у httpOnly cookie
4. **Refresh** — rotation: старий refresh invalid, новий видається
5. Reuse detection — при повторному refresh старого токена revoke вся family

Файли: `auth.service.ts`, `sessions.service.ts`, `jwt.strategy.ts`, `cookies.ts`.

## Guards (NestJS)

| Guard | Перевірка |
|-------|-----------|
| `JwtAuthGuard` | Valid access JWT |
| `AdminPanelGuard` | hasAdminPanelAccess(user) |
| `UserPanelGuard` | hasUserPanelAccess(user) |
| `PermissionsGuard` | `@Permissions('a', 'b')` — достатньо **одного** з keys (OR) |
| `RolesGuard` | userRole student/teacher |

SuperAdmin обходить PermissionsGuard.

## Типи користувачів

| Тип | Ознаки | Доступ |
|-----|--------|--------|
| Super admin | `isSuperAdmin=true` | Все в admin |
| Admin | `adminRoleId` + permissions | За RBAC |
| Teacher | `userRole=teacher` | UserPanel cabinet teacher |
| Student | `userRole=student`, `teacherId` | UserPanel cabinet student |

Admin може мати і adminRole, і userRole — залежить від налаштування.

## Permissions catalog

Повний список у `permissions.catalog.ts`. Групи:

- **Огляд**: dashboard.read
- **Налаштування**: settings.read/write
- **Користувачі**: users.read/write/delete
- **Аналітика**: analytics.read, auth.read
- **Контент**: pages, blocks, icons, about_stats, formats, rules, reviews, faqs
- **Тарифи**: tariffs.*
- **Ліди**: leads.*
- **Ролі**: admin_roles.*
- **Матеріали**: curriculum.*
- **Тести**: tests.*

Preset-набори: `READ_ONLY_PERMISSION_KEYS`, `MANAGER_PERMISSION_KEYS`, `CONTENT_WRITE_KEYS`.

## AdminPanel frontend

`lib/permissions.ts`:

```typescript
hasPermission(user, 'users.read')  // superAdmin → true
filterNav(user)                     // sidebar filtering
```

`lib/api.ts` — при 401 пробує POST `/api/auth/refresh`, потім retry.

## UserPanel frontend

`lib/roles.ts`:

```typescript
canAccessUserPanel(user)
cabinetBasePath('student' | 'teacher')  // /cabinet/student | /cabinet/teacher
```

## Password flows

| Flow | Endpoint |
|------|----------|
| Change password | POST `/api/auth/password` (logged in) |
| Forgot password | POST `/api/auth/forgot-password` → email з token |
| Reset password | POST `/api/auth/reset-password` + token |
| Pending password | Admin створює user з `pendingPassword` → activate на першому login |

## Blocking

`user.status = blocked` → ForbiddenException на login.

Події: `ACCOUNT_BLOCKED`, `ACCOUNT_UNBLOCKED` в AuthEvent.

## Avatar upload

Auth service: JPEG/PNG/WebP/GIF, max 5MB → `uploads/avatars/`.

## Auth events / analytics

Admin може переглядати:

- Сесії користувача
- Події LOGIN, REFRESH, PAGE_VIEW
- Activity dashboard

## Безпека cookies

- `httpOnly`, `sameSite`, `secure` (production)
- Окремі cookies per panel — admin і user не перетинаються

## Типовий stack

**Admin write endpoint:**

```
@UseGuards(JwtAuthGuard, AdminPanelGuard, PermissionsGuard)
@Permissions('curriculum.write')
```

**Cabinet read:**

```
@UseGuards(JwtAuthGuard, UserPanelGuard)
```

Логічний опис ролей — [logical/01-users-auth.md](../logical/01-users-auth.md).
