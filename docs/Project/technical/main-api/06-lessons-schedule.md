# MainApi — Lessons & Schedule

← [MainApi](./README.md)

## Lessons module

```
lessons/
├── lessons.module.ts
├── lessons.service.ts
├── admin-lessons.controller.ts    /api/admin/users/:id/lessons/*
├── cabinet-lessons.controller.ts  /api/cabinet/lessons/*
└── dto/
    ├── propose-lesson.dto.ts
    └── assign-content.dto.ts
```

### CabinetLessonsController — `/api/cabinet/lessons`

Guards: JWT + UserPanel

| Method | Path | Опис |
|--------|------|------|
| GET | `/` | Lessons board (role-aware) |
| GET | `students/:studentId` | Teacher: one student's lessons |
| GET | `:id` | Lesson detail + material + linkedTests |
| GET | `:id/slots` | Available slots (?from=YYYY-MM-DD) |
| POST | `:id/propose` | Propose time (ProposeLessonDto) |
| POST | `:id/accept` | Accept proposal |
| POST | `:id/decline` | Decline proposal |
| POST | `:id/freeze` | Freeze lesson (quota check) |
| POST | `:id/complete` | Mark done |
| POST | `:id/miss` | Mark missed |
| PATCH | `:id/content` | Assign content (AssignContentDto) |

### AdminLessonsController — `/api/admin/users/:id/lessons`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/` | users.read |
| POST | `:lessonId/refund` | users.write |
| POST | `:lessonId/complete` | users.write |
| POST | `:lessonId/skip` | users.write |

---

## LessonsService — методи

| Метод | Опис |
|-------|------|
| `board(userId, role)` | Student: packs; Teacher: students list |
| `teacherGroup(userId, role, studentId)` | One student's lesson pack |
| `show(userId, role, lessonId)` | Detail + resolved material + linkedTests |
| `slots(userId, role, lessonId, from?)` | Free slots from schedule minus taken |
| `propose(userId, role, lessonId, dto)` | status→proposed, set startsAt/endsAt, proposedBy |
| `accept(userId, role, lessonId)` | status→confirmed |
| `decline(userId, role, lessonId)` | Back to unscheduled |
| `freeze(userId, role, lessonId)` | status→frozen, check monthly quota |
| `complete(userId, role, lessonId)` | status→done |
| `assignContent(userId, role, lessonId, dto)` | Set contentLessonId or teacherLessonId |
| `miss(userId, role, lessonId)` | status→missed |
| `completeByAdmin(studentId, lessonId)` | Admin force done |
| `skipByAdmin(studentId, lessonId)` | admin_skip |
| `listForStudent(studentId)` | Admin list |
| `refundByAdmin(studentId, lessonId)` | Refund → unscheduled + refundedAt |
| `syncForTariff(userTariffId)` | Generate lessons from payments |
| `syncForStudent(userId)` | Sync all tariffs for student |

### Status constants (internal)

| Set | Statuses |
|-----|----------|
| LOCKED | proposed, confirmed, done, missed, admin_skip, frozen |
| TAKEN | proposed, confirmed |
| CLOSED | confirmed, done, missed, admin_skip, frozen, cancelled |
| SEQUENCED | proposed, confirmed, done, missed, admin_skip, frozen |

### Slot logic

- Hours: `HOUR_FROM`–`HOUR_TO` (from ScheduleService, typically 6–21)
- `fromSlot(date, hour)` → UTC DateTime
- `isPast(date, hour)` → cannot propose past slots
- Integrates ScheduleService for work/busy rules

### Side effects

- On confirm: MailingTasksService.syncLesson for reminders
- On propose/accept: optional email via MailingsMailerService

---

## Schedule module

```
schedule/
├── schedule.module.ts
├── schedule.service.ts
├── cabinet-schedule.controller.ts  /api/cabinet/schedule/*
└── dto/
    ├── save-work.dto.ts
    └── create-busy.dto.ts
```

### CabinetScheduleController

| Method | Path | Опис |
|--------|------|------|
| GET | `/` | Week overview (?from=) |
| PUT | `work` | Save 7-day work schedule |
| POST | `busy` | Add busy block |
| DELETE | `:id` | Remove rule |

---

## ScheduleService — методи

| Метод | Опис |
|-------|------|
| `overview(userId, from?)` | Week grid: hour states + lesson marks |
| `saveWork(userId, dto, from?)` | Replace weekly work rules (7 WorkDayDto) |
| `addBusy(userId, dto, from?)` | Add busy rule |
| `removeRule(userId, id, from?)` | Delete ScheduleRule |

**Exports:** `HOUR_FROM`, `HOUR_TO` — lesson slot bounds.

### HourState (response)

Per hour cell: `free` | `work` | `busy` | `taken` | `lesson` + optional lesson mark.

### ScheduleRule model

| Field | Опис |
|-------|------|
| kind | work \| busy |
| scope | weekly \| date \| daily |
| weekday | 1–7 (Mon–Sun) for weekly |
| date | specific date for date scope |
| startMinute / endMinute | 0–1439 |

---

## DTOs

| DTO | Поля |
|-----|------|
| `ProposeLessonDto` | date! (YYYY-MM-DD), hour! (6–21) |
| `AssignContentDto` | contentLessonId?, teacherLessonId? (one of) |
| `WorkDayDto` | weekday! (1–7), off!, startMinute!, endMinute! |
| `SaveWorkDto` | days! (exactly 7 WorkDayDto) |
| `CreateBusyDto` | scope!, weekday?, date?, startMinute!, endMinute! |

---

## LessonStatus enum

unscheduled → proposed → confirmed → done  
Branches: missed, frozen, admin_skip, cancelled

## LessonActor enum

teacher | student — хто запропонував час
