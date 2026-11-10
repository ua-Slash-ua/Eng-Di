# EngDi

Монорепозиторій онлайн-школи англійської: API + адмінка + кабінет користувача.

## Структура

```
EngDi/
├── MainApi/      # NestJS REST API, Prisma, MySQL
├── AdminPanel/   # Next.js — адмін-панель
├── UserPanel/    # Next.js — сайт + кабінет учня/вчителя
├── docs/Project/ # Документація (логічна + технічна)
└── AGENTS.md     # Контекст для Cursor / AI
```

## Документація

Почніть з [`docs/Project/README.md`](./docs/Project/README.md).

## Швидкий старт (новий компʼютер)

### 1. Клон

```bash
git clone https://github.com/ua-Slash-ua/Eng-Di.git
cd Eng-Di
```

### 2. Env (без секретів у git)

Скопіюйте приклади і заповніть своїми значеннями:

```bash
cp MainApi/.env.example MainApi/.env
cp AdminPanel/.env.example AdminPanel/.env
cp UserPanel/.env.example UserPanel/.env
```

### 3. Залежності

```bash
cd MainApi && npm install
cd ../AdminPanel && npm install
cd ../UserPanel && npm install
```

### 4. Запуск (dev)

| App | Команда | Типовий порт |
|-----|---------|--------------|
| MainApi | `cd MainApi && npm run start:dev` | 3000 (або як у скриптах) |
| AdminPanel | `cd AdminPanel && npm run dev` | 3001 |
| UserPanel | `cd UserPanel && npm run dev` | 3000 |

Панелі ходять у MainApi через `MAIN_API_URL_*` у `.env`.

### 5. Cursor

Відкрийте корінь `EngDi/` у Cursor. Читайте `AGENTS.md` і `docs/Project/` — там архітектура, ролі, API, БД.

## Що НЕ в репозиторії

- `node_modules/`
- `.env` / секрети / паролі БД / JWT / SMTP
- `uploads/` (завантажені файли)
- `.next/`, `dist/`
