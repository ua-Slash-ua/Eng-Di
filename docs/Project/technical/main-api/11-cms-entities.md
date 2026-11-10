# MainApi — Tariffs & Mailings & Settings & CMS

← [MainApi](./README.md)

## Tariffs

**TariffsService:** list, catalog, pickForBlock, listAdmin, findById, create, update, remove  
**UserTariffsService:** settle, overview, academy, select, cancelScheduled, listForUser, setPaidCount

**Admin:** `/api/admin/tariffs` — CRUD  
**Cabinet:** GET `/api/cabinet/tariffs`, POST `/:id/select`, POST `/scheduled/cancel`

**DTOs:** CreateTariffDto, UpdateTariffDto, SelectTariffDto (confirm?), SetTariffPaymentsDto (paidCount!)

**Helpers:** tariff-dates.ts, tariff-parts.ts — compute startsAt/endsAt, payment parts, lesson generation

---

## Mailings

**Files:** mailings.service.ts, mailing-tasks.service.ts, mailings.mailer.ts, mailing-cron.job.ts, bounce-mail.job.ts, mail-vars.ts, parse-bounce.ts, parse-mail-error.ts

**MailingsService:** record, markBounced, list, stats  
**MailingTasksService:** syncLesson, cancelLesson, tick (process queue), listTasks, listCronRuns  
**MailingsMailerService:** send SMTP from settings

**Admin:** `/api/admin/mailings/stats|logs|tasks|cron-runs` — no @Permissions (any admin)

**MAILING_TYPES:** welcome, password_reset, lesson_reminder, … (11 types in mailing.types.ts)

**Cron:** @nestjs/schedule — scan confirmed lessons → enqueue MailingTask → send → MailingLog

---

## Settings

**SettingsService** + typed modules:

| Key module | Settings key | DTO |
|------------|--------------|-----|
| media-settings.ts | media | UpdateMediaSettingsDto |
| presentation-settings.ts | presentations | UpdatePresentationSettingsDto |
| contact-settings.ts | contacts | UpdateContactsSettingsDto |
| mailing-settings.ts | mailings | UpdateMailingSettingsDto |
| branding-settings.ts | branding | UpdateBrandingSettingsDto |

**Admin:** `/api/admin/settings/{media,presentations,contacts,mailings,branding}`  
**Public:** GET `/api/settings/contacts`, `/api/settings/branding`

**Methods:** get/update each domain, uploadBrandingFile(logo|favicon), isMailingEnabled(type)

---

## CMS entities (faqs, formats, rules, reviews, leads, about-stats, icons)

Each follows pattern: Service (list, listAdmin, findById, create, update, remove) + AdminController

| Module | Prefix | Public GET |
|--------|--------|------------|
| faqs | /admin/faqs | /api/faqs |
| formats | /admin/formats | /api/formats |
| rules | /admin/rules + catalog | /api/rules |
| reviews | /admin/reviews + verify | /api/reviews |
| leads | /admin/leads + categories | POST /api/leads |
| about-stats | /admin/about-stats + categories | /api/about-stats |
| icons | /admin/icons + groups + upload | via blocks |

**IconsService extras:** uploadImages, removeMany, catalog, uploadsRoot

**ReviewsService extras:** listPublic, listPublishable, pickForBlock, listTeachers, listMine, createForUser (cabinet)

**Cabinet reviews:** `/api/cabinet/reviews` — student only

---

## Public ContentController

No auth. Aggregates public reads for UserPanel homepage.

See [api-index.md](./api-index.md)

---

## Database startup

See [12-database-startup.md](./12-database-startup.md)
