# 08. Розсилки (Email)

← [Логічна](./README.md) · [Головна](../README.md)

## Призначення

Система відправляє **transactional email**:

- Скидання пароля
- Нагадування про заняття
- (Розширювано) інші типи через admin module

SMTP налаштовується в **Settings** (host, port, user, password, from).

## Компоненти

| Частина | Роль |
|---------|------|
| **MailingsMailerService** | Відправка одного листа через SMTP |
| **MailingTasksService** | Черга задач з scheduledAt |
| **MailingLog** | Журнал: кому, тип, status, error |
| **MailingCronRun** | Статистика запуску cron |
| **Cron jobs** | Scan + process queue |

## Нагадування про урок

Автоматичний flow:

1. Cron знаходить **confirmed** lessons з `startsAt` у вікні (напр. наступні 24h)
2. Для student і teacher створює **MailingTask** (unique: kind + lessonId + userId)
3. Worker відправляє email з датою/часом (formatLessonWhen)
4. На Lesson ставиться `reminderSentAt`

Якщо урок скасовано — задачі можуть бути cancelled.

## Password reset

1. User → forgot password
2. AuthService створює PasswordResetToken
3. MailingsMailerService → лист з link на `/reset-password?token=...`

## Admin module

**Модулі → Розсилки** (`/modules/mailings`):

- Перегляд логів відправок
- Статус cron runs
- (Залежно від версії) ручні розсилки / шаблони

## Статуси задач

MailingTask.status типово:

- pending → claimed → sent
- або failed / skipped / cancelled

Помилки SMTP пишуться в `error`, `errorRaw`, дублюються в MailingLog.

## Bounce / overdue

Cron може позначати overdue tasks, повторні спроби або skip — деталі в `MailingTasksService` та cron handlers.

## Що бачить admin

- Список логів: email, type, status, час
- Фільтр по типу (password_reset, lesson_reminder…)
- Помилки для діагностики SMTP

## Типовий сценарій

1. Admin налаштував SMTP у Settings
2. Учень і вчитель мають confirmed урок на завтра 10:00
3. О 10:00 попереднього дня cron enqueue 2 tasks
4. Worker відправляє 2 листи «Нагадування: урок завтра о 10:00»
5. MailingLog: status=sent, messageId від SMTP

## Технічні деталі

→ [technical/05-database.md](../technical/05-database.md) (Mailing*)  
→ [technical/02-main-api.md](../technical/02-main-api.md) (MailingsModule)  
→ [technical/07-shared-patterns.md](../technical/07-shared-patterns.md) (Cron)
