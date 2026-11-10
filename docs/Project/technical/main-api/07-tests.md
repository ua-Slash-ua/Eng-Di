# MainApi — Tests

← [MainApi](./README.md)

## Файли

```
tests/
├── tests.module.ts
├── tests.service.ts
├── admin-tests.controller.ts     /api/admin/tests/*
├── cabinet-tests.controller.ts   /api/cabinet/tests/*
└── dto/test.dto.ts
```

---

## AdminTestsController — `/api/admin/tests`

Guards: JWT + AdminPanel + Permissions  
**Read endpoints:** `tests.read` **OR** `curriculum.read` (OR logic)

| Method | Path | Permission | Опис |
|--------|------|------------|------|
| GET | `/` | read | List tests (?kind=free\|material) |
| POST | `/` | tests.write | Create test |
| GET | `:id` | read | Full test with questions |
| PATCH | `:id` | tests.write | Update test + questions |
| DELETE | `:id` | tests.delete | Delete |
| GET | `:id/stats` | read | Aggregate stats |
| GET | `:id/attempts` | read | All attempts |
| GET | `:id/attempts/:attemptId` | read | Attempt detail with answers |

---

## CabinetTestsController — `/api/cabinet/tests`

Guards: JWT + UserPanel + requirePanelUser (student or teacher)

| Method | Path | Опис |
|--------|------|------|
| GET | `me/attempts` | My attempts (?testId=) |
| GET | `:id` | Public meta (questions without isCorrect if not started) |
| POST | `:id/unlock` | Body: `{ password }` → TestAccessGrant |
| POST | `:id/attempts` | Start new attempt |
| POST | `attempts/:attemptId/submit` | Body: `{ answers[] }` → score |

---

## TestsService — методи

| Метод | Опис |
|-------|------|
| `listTests(kind?)` | Admin list with question/attempt counts |
| `findTest(id)` | Full include questions + options |
| `createTest(dto)` | Create with nested questions (max 100 q, 10 options/q) |
| `updateTest(id, dto)` | Upsert questions by id |
| `removeTest(id)` | Cascade delete |
| `getStats(testId)` | Attempt count, avg score, etc. |
| `listAttempts(testId)` | Admin attempt list |
| `getAttemptAdmin(testId, attemptId)` | Full review |
| `getPublicMeta(testId, userId)` | For TakeTestView — grant status, questions |
| `unlock(testId, userId, password)` | Verify entryPassword → create/update grant with TTL |
| `startAttempt(testId, userId)` | Requires active grant → create attempt + orderSnapshot if randomize |
| `submitAttempt(attemptId, userId, dto)` | Grade answers → score → status submitted |
| `listMyAttempts(userId, testId?)` | Cabinet history |
| `listMaterialTestsForChain(chain, userId?)` | Tests linked to chain entities + auto grantMaterialAccess |

### Helpers (private)

| Function | Опис |
|----------|------|
| `normalizeText(value)` | trim + lowercase for write_in compare |
| `shuffle(items)` | Fisher-Yates |
| `durationMs(duration)` | m1→60s, m5→5min, m15→15min, h1→1h, forever→null |
| `isGrantActive(expiresAt)` | Check TTL |

### Grading logic

- **choice:** selectedOptionIds must match set of isCorrect options
- **write_in:** normalize writtenText vs correct option texts
- **randomize:** orderSnapshot stores questionIds + optionIdsByQuestion at start

### Material test auto-grant

When curriculum access granted or lesson content assigned, `grantMaterialAccess(userId, chain)` creates TestAccessGrant for matching material tests.

---

## DTOs (`test.dto.ts`)

| DTO | Поля |
|-----|------|
| `UpsertTestAnswerOptionDto` | id?, text!, kind! (choice\|write_in), isCorrect!, sortOrder? |
| `UpsertTestQuestionDto` | id?, prompt!, sortOrder?, options![] |
| `CreateTestDto` | title!, description?, kind!, entityType?, entityId?, accessDuration!, entryPassword!, randomize?, sortOrder?, questions?[] |
| `UpdateTestDto` | all optional |
| `UnlockTestDto` | password! |
| `SubmitAttemptAnswerDto` | questionId!, selectedOptionIds?, writtenText? |
| `SubmitAttemptDto` | answers![] |

---

## Prisma enums

| Enum | Values |
|------|--------|
| `TestKind` | free, material |
| `TestAccessDuration` | m1, m5, m15, h1, forever |
| `TestAnswerKind` | choice, write_in |
| `TestAttemptStatus` | in_progress, submitted, expired |

## Models

- `Test` — entryPassword, entityType+entityId for material
- `TestQuestion` — prompt, sortOrder
- `TestAnswerOption` — text, kind, isCorrect
- `TestAccessGrant` — userId+testId unique, expiresAt
- `TestAttempt` — score, orderSnapshot JSON
- `TestAttemptAnswer` — selectedOptionIds JSON, writtenText, isCorrect

---

## Frontend integration

| Panel | Component | Route |
|-------|-----------|-------|
| AdminPanel | TestEditView | `/materials/tests/[id]` |
| UserPanel | TakeTestView | `/materials/tests/[id]` |
| UserPanel | LinkedTestsPanel | library + lesson views |
