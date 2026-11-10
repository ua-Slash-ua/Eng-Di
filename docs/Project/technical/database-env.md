# Бази даних (ENV)

← [Головна](../README.md)

## Два середовища

```env
ENV=STAGE   # локальна розробка
ENV=PROD    # production (обережно!)

DATABASE_URL_STAGE="mysql://.../slash00_engdi"
DATABASE_URL_PROD="mysql://.../slash00_engdiprod"
```

При старті API `ENV` автоматично підставляє відповідний `DATABASE_URL_*` у Prisma.

| ENV | База | Коли |
|-----|------|------|
| **STAGE** | `slash00_engdi` | Локальна розробка, тести |
| **PROD** | `slash00_engdiprod` | Бойовий сайт — тільки свідомо |

## Локально

```env
ENV=STAGE
```

Окремої «project» бази не потрібно — STAGE і є dev-база.

## Команди

```bash
cd MainApi
npm run prisma:push   # schema → поточний ENV
npm run db:sync-prod  # STAGE → PROD: CMS + users #7, #13 (потребує --yes у скрипті)
```

### Наповнення PROD з STAGE

```bash
npm run db:sync-prod
```

Копіює: сторінки, блоки, FAQ, тарифи (каталог), settings, icons, reviews, permissions/roles, lead_categories  
Не копіює: curriculum, tests, lessons, leads, mailings, user_tariffs  
Користувачі: лише **#7** і **#13** (ті самі id)

На хостингу в `api/.env`: `ENV=PROD`, правильний `DATABASE_URL_PROD` (пароль з `&` → `%26`).
