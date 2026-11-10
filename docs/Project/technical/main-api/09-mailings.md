# MainApi — Mailings

← [MainApi](./README.md)

## Architecture

```
MailingCronJob (schedule)
    → scan lessons / overdue tasks
    → MailingTasksService.enqueue
MailingTasksService.tick()
    → claim pending tasks
    → MailingsMailerService.send()
    → MailingsService.record() → MailingLog
BounceMailJob
    → parse bounces → markBounced
```

## MailingsMailerService

- Reads SMTP from Settings (mailing-settings)
- Template substitution via mail-vars.ts (formatLessonWhen, MailPerson, …)
- Returns messageId for logging

## MailingTasksService

| Method | Опис |
|--------|------|
| `syncLesson(lessonId)` | Create/update reminder tasks for confirmed lesson |
| `cancelLesson(lessonId, reason)` | Cancel pending tasks on cancel/decline |
| `tick()` | Process queue batch |
| `listTasks(query)` | Admin paginated |
| `listCronRuns(query)` | Cron history |

**Unique constraint:** (kind, lessonId, userId) — one reminder per user per lesson.

## MailingsService

| Method | Опис |
|--------|------|
| `record(data)` | Insert MailingLog |
| `markBounced(data)` | Mark failed delivery |
| `list(query)` | Admin logs |
| `stats()` | Aggregates for dashboard |

## Types (mailing.types.ts)

- MAILING_TYPES — 11 types with Ukrainian labels
- MAILING_TASK_STATUSES — pending, claimed, sent, skipped, cancelled, failed
- CRON_MAILING_KINDS — lesson_reminder

## Settings integration

UpdateMailingSettingsDto:
- enabled flags per type
- templates: subject + body per MailingType
- welcomeRegistration, passwordReset, …

Admin: GET/PATCH `/api/admin/settings/mailings` (no permission decorator)

## Admin module UI

AdminPanel → `/modules/mailings` — MailingsModuleView, logs, cron runs

## Auth integration

- forgotPassword → password_reset mailing
- Account welcome on create (if enabled)

## Lesson reminders

Confirmed lesson with startsAt in window → tasks for student + teacher → reminderSentAt on Lesson after send.

See logical [08-mailings.md](../../logical/08-mailings.md)
