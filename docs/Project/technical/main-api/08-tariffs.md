# MainApi — Tariffs

← [MainApi](./README.md)

## TariffsService

| Method | Опис |
|--------|------|
| `list()` | Public tariff list sorted |
| `catalog()` | Admin picker |
| `pickForBlock(ids, limit?)` | Resolve IDs for pricing block |
| `listAdmin(query)` | Paginated admin |
| `findById(id)` | Single |
| `create/update/remove` | Admin CRUD |

## UserTariffsService

| Method | Опис |
|--------|------|
| `settle(userId)` | Expire overdue subscriptions |
| `overview(userId)` | Cabinet view: active, scheduled, history |
| `academy(userId)` | Academy-specific data |
| `select(userId, tariffId, confirm?)` | Student selects new tariff |
| `cancelScheduled(userId)` | Cancel future subscription |
| `listForUser(userId)` | Admin: user's subscriptions |
| `setPaidCount(userId, userTariffId, paidCount)` | Admin: mark payments → **generates lessons** |

## Lesson generation flow

1. Admin sets `paidCount` on UserTariffPayment parts
2. `syncForTariff` / `syncForStudent` in LessonsService creates Lesson rows
3. Each lesson: unscheduled, linked to paymentId + userTariffId + number

## DTOs

CreateTariffDto — full tariff fields (see database/models.md)  
SelectTariffDto — confirm?: boolean (for duplicate warning)  
SetTariffPaymentsDto — paidCount!: number

## Cabinet endpoints

GET `/api/cabinet/tariffs` — StudentTariffsView data  
POST `/api/cabinet/tariffs/:id/select`  
POST `/api/cabinet/tariffs/scheduled/cancel`

## Admin endpoints

Full CRUD `/api/admin/tariffs`

Public: GET `/api/tariffs`
