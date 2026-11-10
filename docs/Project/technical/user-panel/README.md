# UserPanel — повний технічний довідник

← [Технічна](../README.md) · [Головна](../../README.md)

## Зміст

| Файл | Зміст |
|------|--------|
| [routes.md](./routes.md) | Усі маршрути + layouts |
| [features.md](./features.md) | auth, home, cabinet, tests |
| [lib-components.md](./lib-components.md) | lib, components, proxy |

## Архітектура

```
UserPanel/src/
├── app/
│   ├── (public)/          → /
│   ├── (auth)/            → login, forgot/reset
│   ├── cabinet/           → student + teacher
│   ├── materials/tests/   → TakeTestView
│   └── api/[...path]/     → proxy
├── features/
├── components/
└── lib/
```

121 файлів у `src/`.

## Dual mode

1. **Public** — SSR homepage, no auth
2. **Cabinet** — client auth, role gates

## Dev

Port **3000**, `MAIN_API_URL`, `API_INTERNAL_URL` for SSR.

## Production note

Upload **full** `.next` after build — partial deploy → 404 on chunks.
