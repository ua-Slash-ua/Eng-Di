# MainApi — Auth

← [MainApi](./README.md)

## Файли модуля

```
auth/
├── auth.module.ts
├── auth.controller.ts          /api/auth/*
├── admin-auth.controller.ts    /api/admin/auth/*, /api/admin/users/:id/*
├── auth.service.ts
├── auth-events.service.ts
├── sessions.service.ts
├── jwt.strategy.ts
├── jwt-auth.guard.ts
├── optional-jwt-auth.guard.ts
├── admin-panel.guard.ts
├── user-panel.guard.ts
├── permissions.guard.ts
├── permissions.decorator.ts
├── permissions.catalog.ts
├── roles.guard.ts
├── roles.decorator.ts
├── cookies.ts
├── access-payload.ts
├── request-context.ts
├── duration.ts
├── login-rate-limit.ts
└── dto/
    ├── login.dto.ts
    ├── change-password.dto.ts
    ├── forgot-password.dto.ts
    ├── reset-password.dto.ts
    ├── update-profile.dto.ts
    └── page-view.dto.ts
```

---

## AuthController — `/api/auth`

| Method | Path | Guards | Body / Query | Response |
|--------|------|--------|--------------|----------|
| POST | `login` | — | `LoginDto` | `{ user: PublicUser }` + Set-Cookie |
| POST | `refresh` | — | refresh cookie | new tokens + cookies |
| POST | `forgot-password` | — | `ForgotPasswordDto` | `{ ok: true }` |
| POST | `reset-password` | — | `ResetPasswordDto` | `{ ok: true }` |
| GET | `me` | — | — | `{ user }` or 401 |
| POST | `logout` | OptionalJwt | — | clears cookies |
| POST | `logout-others` | JwtAuth | — | revoke other sessions |
| PATCH | `profile` | JwtAuth | `UpdateProfileDto` | `{ user }` |
| POST | `profile/avatar` | JwtAuth | multipart file | `{ user }` |
| POST | `profile/avatar/remove` | JwtAuth | — | `{ user }` |
| PATCH | `password` | JwtAuth | `ChangePasswordDto` | `{ ok: true }` |
| POST | `password/forgot` | JwtAuth | — | self reset email |
| POST | `page-view` | OptionalJwt | `PageViewDto` | `{ ok: true }` |

---

## AdminAuthController — `/api/admin`

Guards: `JwtAuthGuard`, `AdminPanelGuard`, `PermissionsGuard`

| Method | Path | Permission | Опис |
|--------|------|------------|------|
| GET | `auth/summary` | analytics.read | Коротка статистика auth |
| GET | `auth/overview` | analytics.read | Детальний overview |
| GET | `auth/events` | auth.read | Paginated auth events |
| GET | `auth/sessions` | auth.read | Active sessions list |
| POST | `auth/logout-all` | auth.read | Revoke all sessions globally |
| POST | `auth/unblock-all` | users.write | Unblock all blocked users |
| POST | `sessions/:id/revoke` | auth.read | Revoke one session |
| GET | `users/:id/auth` | auth.read | User auth stats |
| POST | `users/:id/logout` | users.write | Revoke user sessions |
| POST | `users/:id/block` | users.write | Block user |
| POST | `users/:id/unblock` | users.write | Unblock user |
| POST | `users/:id/reset-password` | users.write | Temp password |

---

## AuthService — методи

| Метод | Опис |
|-------|------|
| `login(dto, req, res)` | bcrypt verify → rate limit → panel check → create session → set cookies → LOGIN_SUCCESS event |
| `refresh(req, res)` | Read refresh → rotate (SessionsService) → new access cookie |
| `resolveMe(req, res)` | Parse access token → return PublicUser |
| `logout(req, res, authUser?)` | Revoke session, clear cookies, LOGOUT event |
| `logoutOthers(authUser, req)` | Revoke all user sessions except current |
| `updateProfile(userId, dto, req, sessionId?)` | Update firstName, lastName, middleName, birthDate, phone |
| `changePassword(authUser, dto, req)` | Verify current → hash new → PASSWORD_CHANGED |
| `uploadAvatar(authUser, file)` | Validate mime/size → save uploads/avatars/ → update avatarUrl |
| `removeAvatar(authUser)` | Delete file → null avatarUrl |
| `forgotPassword(dto)` | Create PasswordResetToken → send email |
| `requestOwnPasswordReset(authUser)` | Same for logged-in user |
| `resetPassword(dto, req)` | Verify token → set password → mark token used |
| `userFromAccess(token, panel)` | JWT verify → load user → AuthUser |
| `setAuthCookies(res, access, refresh, panel)` | httpOnly secure cookies |
| `clearAuthCookies(res, panel)` | Expire cookies |

**Avatar limits:** JPEG/PNG/WebP/GIF, max 5MB.

**Env:** `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN` (default 15m), `JWT_REFRESH_EXPIRES_IN` (default 30d), `COOKIE_SECURE`.

---

## SessionsService — методи

| Метод | Опис |
|-------|------|
| `hashRefreshToken(token)` | SHA-256 hash для зберігання |
| `create(userId, ttlMs, ctx)` | Нова сесія + refresh token plaintext |
| `rotate(refreshToken, ttlMs, ctx)` | Invalidate old → new session (rotation) |
| `findById(id)` | Lookup session |
| `findByRefreshToken(token)` | Lookup by hash |
| `assertActive(id)` | Throw if revoked/expired |
| `touch(id)` | Update lastUsedAt |
| `revokeSession(id, reason)` | Set revokedAt |
| `revokeFamily(familyId, reason)` | Revoke all in token family (reuse attack) |
| `revokeUser(userId, reason, except?)` | Revoke all user sessions |
| `revokeAll(reason, except?)` | Global revoke |
| `listActive(query)` | Admin paginated sessions |
| `toPublic(session, currentSessionId?)` | Format for API |

**Refresh rotation:** при refresh старий token invalid, новий видається. Reuse старого → revoke вся family.

---

## AuthEventsService — методи

| Метод | Опис |
|-------|------|
| `record(input)` | Insert AuthEvent (LOGIN_SUCCESS, LOGIN_FAILED, …) |
| `recordPageView(input)` | PAGE_VIEW з dedup (same path/session window) |
| `list(query)` | Paginated events для admin |
| `summary()` | Counts для dashboard |
| `overview()` | Ranked users, trends |
| `userStats(userId)` | Per-user login history |

**AuthEventType enum:** LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, LOGOUT_ALL, REFRESH, REFRESH_REUSE, SESSION_REVOKED, PASSWORD_CHANGED, PASSWORD_RESET, PROFILE_UPDATED, ACCOUNT_CREATED, ACCOUNT_BLOCKED, ACCOUNT_UNBLOCKED, PAGE_VIEW.

---

## Permissions catalog

44 permissions у `permissions.catalog.ts`. Формат key: `{resource}.{action}`.

| Група | Keys |
|-------|------|
| Огляд | dashboard.read |
| Налаштування | settings.read, settings.write |
| Користувачі | users.read, users.write, users.delete |
| Аналітика | analytics.read, auth.read |
| Контент | pages.*, blocks.*, icons.*, about_stats.*, formats.*, rules.*, reviews.*, faqs.* |
| Тарифи | tariffs.* |
| Ліди | leads.* |
| Ролі | admin_roles.* |
| Матеріали | curriculum.* |
| Тести | tests.* |

Presets: `ALL_PERMISSION_KEYS`, `READ_ONLY_PERMISSION_KEYS`, `MANAGER_PERMISSION_KEYS`, `CONTENT_WRITE_KEYS`.

**PermissionsGuard:** `@Permissions('a', 'b')` — достатньо **одного** з keys (OR). SuperAdmin завжди pass.

---

## DTOs

| DTO | Поля | Валідація |
|-----|------|-----------|
| `LoginDto` | email!, password! | email trim+lowercase |
| `ChangePasswordDto` | currentPassword!, newPassword! | min length |
| `ForgotPasswordDto` | email! | |
| `ResetPasswordDto` | token!, newPassword! | |
| `UpdateProfileDto` | firstName!, lastName!, middleName?, birthDate?, phone? | |
| `PageViewDto` | path! | must start with `/` |

---

## User types (`users/user.types.ts`)

| Type | Поля / Опис |
|------|-------------|
| `PublicUser` | id, email, name, firstName, lastName, middleName, birthDate, phone, avatarUrl, userRole, isSuperAdmin, adminRole, permissions[], status, activatedAt, createdAt |
| `AdminUser` | PublicUser + pendingPassword?, pendingExpiresAt? |
| `AuthUser` | PublicUser + sessionId |
| `PublicAdminRole` | id, name, slug |
| `hasAdminPanelAccess(user)` | isSuperAdmin \|\| adminRoleId |
| `hasUserPanelAccess(user)` | userRole in [student, teacher] |
| `formatAccessSummary(user)` | Ukrainian label для UI |
