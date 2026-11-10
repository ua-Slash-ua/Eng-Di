# MainApi — Database Startup

← [MainApi](./README.md)

## Entry: `database/startup/runStartup.ts`

Called from `PrismaService.onModuleInit()` after `$connect()`.

```
runMigrations() → runSeeds()
```

Idempotent — safe on every boot.

---

## Migrations (`migrations/`)

DDL patches via raw SQL + `columnExists()` checks.

| File | Purpose |
|------|---------|
| migrateAuth.ts | Auth sessions, events tables |
| migrateRoles.ts | Admin roles, permissions |
| migrateDualAccess.ts | Panel-specific cookies support |
| migrateAccountActivation.ts | pendingPassword, activatedAt |
| migrateUserProfileFields.ts | firstName, lastName, … |
| migrateUserAvatar.ts | avatarUrl |
| migratePasswordReset.ts | password_reset_tokens |
| migratePasswordResetTemplate.ts | mailing template |
| migrateBlocks.ts | blocks, blocks_meta |
| migratePageSections.ts | page_sections |
| migratePageSeo.ts | page_seo |
| migrateTariffs.ts | tariffs table |
| migrateTariffSubscriptions.ts | user_tariffs |
| migrateTariffPayments.ts | user_tariff_payments |
| migrateLessons.ts | lessons table |
| migrateLessonFreeze.ts | frozen status, frozenAt |
| migrateLessonOutcomes.ts | done, missed, etc. |
| migrateLessonReminders.ts | reminderSentAt |
| migrateLessonPresentations.ts | lesson_presentations |
| migrateScheduleRules.ts | schedule_rules |
| migrateTeacherStudents.ts | teacherId on users |
| migrateCurriculum.ts | content_* tables |
| migrateTests.ts | tests schema |
| migrateFaqs.ts | faqs |
| migrateFormats.ts | formats |
| migrateAboutStats.ts | about_stats |
| migrateRules.ts | school_rules |
| migrateReviews.ts | reviews |
| migrateIcons.ts | icons, icon_groups |
| migrateIconColumns.ts | media columns on icons |
| migrateSettings.ts | settings key-value |
| migrateMailingLogs.ts | mailing_logs |
| migrateMailingLogErrors.ts | error_raw |
| migrateMailingLogMessageId.ts | message_id |
| migrateMailingCron.ts | mailing_cron_runs, mailing_tasks |
| migrateLeadMeta.ts | lead location, categories |
| migrateUpdatedAt.ts | updated_at columns |

---

## Seeds (`seeds/`)

| File | Purpose |
|------|---------|
| seedPermissions.ts | Sync PERMISSION_CATALOG → DB |
| seedAdminRoles.ts | Default admin roles |
| seedAccounts.ts | Super admin + demo users |
| seedSettings.ts | Default SMTP, branding, limits |
| seedHomePage.ts | Page slug=home |
| seedHomePageSections.ts | Attach blocks to home |
| seedSectionStubBlocks.ts | Placeholder blocks |
| seedBlocks.ts | Hero, about, … block records |
| seedHeroBlock.ts, seedPricingBlock.ts, … | Block meta content |
| seedTariffs.ts | Demo tariff plans |
| seedFormats.ts | Learning formats |
| seedRules.ts + seedRulesBlock.ts | Rules |
| seedReviews.ts + seedReviewsBlock.ts | Reviews |
| seedAboutStats.ts | Stats |
| seedFaqs.ts | FAQ entries |
| seedIcons.ts | Default SVG icons |
| seedLeadCategories.ts | Lead categories |
| seedCurriculum.ts | Demo levels/courses/units/lessons |
| seedTests.ts | Demo tests |

---

## Utilities

| File | Purpose |
|------|---------|
| columnExists.ts | Check before ALTER |
| iconSvgs.ts | Inline SVG strings for seeds |

---

## Prisma migrate vs startup

- **Prisma migrate** — schema sync from schema.prisma (dev/deploy)
- **Startup migrations** — production hotfixes, extra columns, data backfills

Both can coexist; startup runs every API boot.
