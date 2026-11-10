# EngDi — контекст для агента (Cursor)

Цей файл — коротка «карта» монорепо. Деталі завжди в `docs/Project/`.

## Що це

Платформа онлайн-школи англійської (**EngDi**):

- **MainApi** — NestJS 11 + Prisma + MySQL (єдине API)
- **AdminPanel** — Next.js 15 адмінка
- **UserPanel** — Next.js 15 публічний сайт + кабінет учня/вчителя

Один продукт, один репозиторій. Не розбивати на окремі репо без сильної потреби.

## Де шукати правду

1. `docs/Project/README.md` — індекс усієї документації
2. `docs/Project/logical/` — бізнес-логіка (ролі, сценарії)
3. `docs/Project/technical/` — код, API, структура файлів
4. `docs/Project/database/models.md` — моделі Prisma
5. `MainApi/prisma/schema.prisma` — актуальна схема БД

## Правила змін

- Не комітити `.env`, секрети, `node_modules`, `uploads`, `.next`, `dist`
- Env-шаблони: `*/.env.example` (плейсхолдери, без реальних паролів)
- Панелі проксують API через `src/app/api/[...path]/route.ts` → `MAIN_API_URL`
- Заголовок `X-EngDi-Panel`: `admin` | `user` (окремі cookie-сесії)
- Startup-міграції БД: `MainApi/src/database/startup/` (не лише prisma migrate)

## Ключові домени

| Домен | Де код | Доки |
|-------|--------|------|
| Auth / RBAC | MainApi `auth/`, `admin-roles/` | technical/06-auth-permissions.md |
| Users / class | MainApi `users/` | logical/01-users-auth.md |
| Curriculum | MainApi `curriculum/` | logical/03-curriculum.md |
| Lessons / schedule | MainApi `lessons/`, `schedule/` | logical/04-lessons-schedule.md |
| Tests / attempts / quotas | MainApi `tests/` | logical/05-tests.md, technical/main-api/07-tests.md |
| Settings / UI New badge | MainApi `settings/` | technical/main-api/10-settings.md |
| Teacher library | UserPanel `features/cabinet/library/` | — |
| Student materials | UserPanel `features/cabinet/library/StudentMaterialsView.tsx` | — |
| Take test | UserPanel `features/tests/` | — |
| Admin tests | AdminPanel `features/tests/` | — |

## Локальний запуск (коротко)

```bash
# з кореня після clone
cp MainApi/.env.example MainApi/.env
cp AdminPanel/.env.example AdminPanel/.env
cp UserPanel/.env.example UserPanel/.env
# заповнити DATABASE_URL_*, JWT_SECRET, MAIN_API_URL_*

cd MainApi && npm i && npm run start:dev
cd AdminPanel && npm i && npm run dev
cd UserPanel && npm i && npm run dev
```

## UI / продукт (важливі домовленості)

- Кабінет: лайм `#c8f04d`, rail темно-зелений
- Бейдж **New**: `UserPanel/src/components/NewBadge.tsx`, глобальний прапор `settings.ui.showNewBadges`
- Тести: `maxAttempts` (дефолт 3) + `TestAttemptQuota.extraAttempts` (0…5) від вчителя/адміна
- Після зміни правильних відповідей у тесті — перерахунок зданих спроб (upsert питань, не wipe)

## Мова UI

Інтерфейс продукту — **українською**.
