# 05. Тести

← [Логічна](./README.md) · [Головна](../README.md)

## Два типи тестів

| Kind | Призначення |
|------|-------------|
| **free** | Вільний тест — доступ за посиланням + паролем |
| **material** | Прив'язаний до матеріалу (урок/юніт/курс/рівень) |

Admin → **Матеріали → Тести** — створення та редагування.

## Структура тесту

- **Title**, description
- **Entry password** — пароль для входу (навіть якщо grant є)
- **Access duration** — скільки діє grant після unlock: 1 хв, 5 хв, 15 хв, 1 год, forever
- **Randomize** — перемішувати питання та варіанти відповідей
- **Questions** — до 100 питань
- **Options** — choice (radio/checkbox) або write_in (текстова відповідь)

## Як учень/вчитель проходить тест

1. Отримує **grant** (доступ) — явно або автоматично
2. Відкриває URL `/materials/tests/[id]`
3. Вводить **entry password**
4. **Start attempt** — створюється TestAttempt (in_progress)
5. Відповідає на питання по одному (TakeTestView)
6. **Submit** — score, status submitted

Спроби зберігаються в БД (`TestAttempt`, `TestAttemptAnswer`).

## Grant (доступ до тесту)

### Free test

- Admin дає посилання + пароль
- Користувач логіниться в кабінет
- POST **unlock** з паролем → створюється TestAccessGrant з TTL за accessDuration

### Material test

Grant видається автоматично коли:

- Admin видав вчителю **curriculum grant** на entity в ланцюжку тесту
- На заняття **assign** матеріал, до якого прив'язаний тест

`TestsService.listMaterialTestsForChain()` знаходить тести для entity + батьків (lesson→unit→course→level).

## Linked tests у UI

### Бібліотека / матеріал (вчитель)

**LinkedTestsPanel** показує:

- Назву тесту
- **Посилання** для копіювання
- **Пароль** (для передачі учню)

### Бібліотека / матеріал (учень)

Показує кнопку **Пройти тест** якщо grant active.

### Сторінка заняття

Те саме — тести матеріалу заняття.

## Перевірка відповідей

- **choice** — порівняння selectedOptionIds з isCorrect
- **write_in** — normalize (trim, lowercase) порівняння тексту

При randomize порядок фіксується в `orderSnapshot` на старті attempt.

## Expired grant

Якщо accessDuration ≠ forever — `expiresAt` на grant. Після expiry потрібен повторний unlock (якщо дозволено політикою).

## Admin workflow

1. Створити тест (free або material)
2. Для material — обрати entity в searchable select (показує тип: Урок/Юніт/Курс/Рівень)
3. Додати питання та варіанти
4. Зберегти — entry password генерується/задається
5. Поділитись link + password з учнями (або rely on auto-grant через матеріал)

## Permissions

Перегляд списку тестів: `tests.read` **або** `curriculum.read`.

Редагування: `tests.write`.

## API (cabinet)

| Дія | Endpoint |
|-----|----------|
| Unlock | POST `/api/cabinet/tests/:id/unlock` |
| Start | POST `/api/cabinet/tests/:id/attempts` |
| Submit | POST `/api/cabinet/tests/attempts/:id/submit` |
| My attempts | GET `/api/cabinet/tests/me/attempts` |

*(UI історії спроб у кабінеті може бути ще не реалізований.)*

## Типовий сценарій (material)

1. Admin створює тест «Unit 1 Quiz» → entityType=unit, entityId=5
2. Admin видає вчителю grant на Unit 5
3. Вчитель відкриває unit у бібліотеці → бачить linked test + пароль
4. На занятті assign unit lesson → учень бачить «Пройти тест»
5. Учень unlock → проходить → score 8/10

## Технічні деталі

→ [technical/05-database.md](../technical/05-database.md) (Test*)  
→ [technical/02-main-api.md](../technical/02-main-api.md) (TestsModule)
