# AdminPanel — повний технічний довідник

← [Технічна](../README.md) · [Головна](../../README.md)

## Зміст

| Файл | Зміст |
|------|--------|
| [routes.md](./routes.md) | Усі 51 page.tsx маршрути |
| [features.md](./features.md) | 18 feature modules: api, types, components |
| [components-lib.md](./components-lib.md) | UI, fields, lib, hooks |

## Архітектура

```
AdminPanel/src/
├── app/
│   ├── login/page.tsx
│   ├── api/[...path]/route.ts    → proxy MAIN_API_URL
│   └── (panel)/                    → AdminShell layout
├── features/                       → domain modules
├── components/ui/ + fields/
├── hooks/
└── lib/                            → api, auth, nav, permissions
```

## Proxy

`app/api/[...path]/route.ts`:
- Target: `{MAIN_API_URL}/api/{path}`
- Forwards cookies, strips Domain from Set-Cookie
- Blocks upstream redirects (502 if misconfigured MAIN_API_URL)
- Methods: GET, POST, PATCH, PUT, DELETE

## Client API (`lib/api.ts`)

```typescript
api<T>(path, options?)  // fetch /api/... with X-EngDi-Panel: admin
onUnauthorized(handler) // redirect to /login
```

Auto refresh on 401 via POST `/api/auth/refresh`.

## Auth (`lib/auth.tsx`)

| Export | Опис |
|--------|------|
| `AuthProvider` | Wraps panel, loads `/api/auth/me` |
| `useAuth()` | `{ user, login, logout, refresh, updateProfile, ... }` |

## Navigation (`lib/nav.ts`)

9 groups, `filterNav(user)` by permissions. Див. [features.md](./features.md#nav).

## Dev

Port **3001**, env `MAIN_API_URL=http://127.0.0.1:4000`
