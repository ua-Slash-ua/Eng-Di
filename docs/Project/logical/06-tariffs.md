# 06. Тарифи

← [Логічна](./README.md) · [Головна](../README.md)

## Що таке тариф

**Tariff** — пакет послуг для учня: N уроків за ціною з певними умовами.

Admin → **Сайт → Тарифи** — CRUD.

На лендингу тарифи показуються в секції Pricing (з блоку або прямий fetch).

## Поля тарифу

| Поле | Значення |
|------|----------|
| title | Назва пакету |
| lessons | Кількість уроків |
| price / oldPrice | Ціна (можна «закреслену» стару) |
| popular | Позначка «популярний» |
| note | Підпис під ціною |
| variant | Візуальний варіант картки |
| paymentMode | **once** — одразу / **installments** — частинами |
| installmentCount | Скільки платежів |
| durationMonths | Тривалість дії пакету |
| frozenLessonsPerMonth | Ліміт заморозок на місяць |

## Підписка учня (UserTariff)

Коли учню **активують** тариф:

1. Створюється `UserTariff` (status: active/scheduled)
2. `startsAt`, `endsAt` — період дії
3. Генеруються **UserTariffPayment** частини (якщо installments)
4. При оплаті частини — генеруються **Lesson** записи (unscheduled)

## Статуси підписки

| Status | Опис |
|--------|------|
| **active** | Діє зараз |
| **scheduled** | Майбутня (ще не почалась) |
| **expired** | Закінчилась |
| **cancelled** | Скасована |

## Кабінет учня → Тарифи

**StudentTariffsView**:

- Поточний пакет: скільки уроків залишилось, термін
- Історія / майбутні підписки
- Можливість **обрати новий тариф** (select) — якщо передбачено flow
- Cancel — скасування майбутньої підписки

*(Точний UX залежить від бізнес-процесу оплати — online payment може бути поза системою.)*

## Зв'язок урок ↔ оплата

Кожен Lesson має:

- `userTariffId` — який пакет
- `paymentId` — яка частина оплати «видала» цей урок

При installment: уроки 1–4 після 1-го платежу, 5–8 після 2-го тощо.

## Admin workflow

1. Створити тарифи (Start, Pro, Intensive…)
2. Прив'язати до блоку Tariffs на головній
3. При заявці (Lead) або вручну — створити user + UserTariff
4. Позначити оплату (paidAt на UserTariffPayment) → уроки з'являються у учня

## Типовий сценарій

1. Гість бачить на сайті «8 уроків — 3200 грн»
2. Залишає заявку
3. Admin створює учня, активує тариф active на 2 місяці
4. Admin фіксує оплату → 8 unscheduled lessons
5. Учень у кабінеті бачить 8 уроків і може планувати через розклад

## Технічні деталі

→ [technical/05-database.md](../technical/05-database.md) (Tariff, UserTariff, UserTariffPayment)  
→ [technical/02-main-api.md](../technical/02-main-api.md) (TariffsModule)
