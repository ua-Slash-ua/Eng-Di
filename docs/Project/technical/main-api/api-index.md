# MainApi — API Index (повний)

← [MainApi](./README.md)

> Base: `/api` · Permission OR: `@Permissions('a','b')` = any match · SuperAdmin bypasses permissions

## Public (no auth)

| Method | Path | Controller |
|--------|------|------------|
| GET | `/health` | HealthController |
| GET | `/about-stats` | PublicContentController |
| GET | `/formats` | PublicContentController |
| GET | `/tariffs` | PublicContentController |
| GET | `/rules` | PublicContentController |
| GET | `/faqs` | PublicContentController |
| GET | `/reviews` | PublicContentController |
| GET | `/blocks` | PublicContentController |
| GET | `/blocks/:id` | PublicContentController |
| GET | `/pages/:slug` | PublicContentController |
| POST | `/leads` | PublicContentController |
| GET | `/settings/contacts` | PublicSettingsController |
| GET | `/settings/branding` | PublicSettingsController |

## Auth — `/auth`

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/login` | — |
| POST | `/auth/refresh` | refresh cookie |
| POST | `/auth/forgot-password` | — |
| POST | `/auth/reset-password` | — |
| GET | `/auth/me` | optional |
| POST | `/auth/logout` | optional |
| POST | `/auth/logout-others` | JWT |
| PATCH | `/auth/profile` | JWT |
| POST | `/auth/profile/avatar` | JWT |
| POST | `/auth/profile/avatar/remove` | JWT |
| PATCH | `/auth/password` | JWT |
| POST | `/auth/password/forgot` | JWT |
| POST | `/auth/page-view` | optional |

## Admin — `/admin`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/admin/stats` | dashboard.read |
| GET | `/admin/users` | users.read |
| GET | `/admin/users/directory` | users.read |
| GET | `/admin/users/:id` | users.read |
| GET | `/admin/users/:id/class` | users.read |
| GET | `/admin/users/:id/tariffs` | users.read |
| GET | `/admin/users/:id/lessons` | users.read |
| PATCH | `/admin/users/:id` | users.write |
| POST | `/admin/users` | users.write |
| DELETE | `/admin/users/:id` | users.write + super |
| PATCH | `/admin/users/:id/teacher` | users.write |
| POST | `/admin/users/:id/students` | users.write |
| DELETE | `/admin/users/:id/students/:studentId` | users.write |
| PATCH | `/admin/users/:id/tariffs/:subId/payments` | users.write |
| POST | `/admin/users/:id/lessons/:lessonId/refund` | users.write |
| POST | `/admin/users/:id/lessons/:lessonId/complete` | users.write |
| POST | `/admin/users/:id/lessons/:lessonId/skip` | users.write |
| GET | `/admin/permissions` | admin_roles.read |
| GET | `/admin/admin-roles` | admin_roles.read |
| GET | `/admin/admin-roles/:id` | admin_roles.read |
| POST | `/admin/admin-roles` | admin_roles.write + super |
| PATCH | `/admin/admin-roles/:id` | admin_roles.write + super |
| DELETE | `/admin/admin-roles/:id` | admin_roles.write + super |
| GET | `/admin/auth/summary` | analytics.read |
| GET | `/admin/auth/overview` | analytics.read |
| GET | `/admin/auth/events` | auth.read |
| GET | `/admin/auth/sessions` | auth.read |
| POST | `/admin/auth/logout-all` | auth.read |
| POST | `/admin/auth/unblock-all` | users.write |
| POST | `/admin/sessions/:id/revoke` | auth.read |
| GET | `/admin/users/:id/auth` | auth.read |
| POST | `/admin/users/:id/logout` | users.write |
| POST | `/admin/users/:id/block` | users.write |
| POST | `/admin/users/:id/unblock` | users.write |
| POST | `/admin/users/:id/reset-password` | users.write |
| GET | `/admin/pages` | pages.read |
| POST | `/admin/pages` | pages.write |
| GET | `/admin/pages/:id` | pages.read |
| PATCH | `/admin/pages/:id` | pages.write |
| DELETE | `/admin/pages/:id` | pages.delete |
| POST | `/admin/pages/:id/sections` | pages.write |
| PATCH | `/admin/pages/:id/sections/reorder` | pages.write |
| DELETE | `/admin/page-sections/:id` | pages.write |
| GET | `/admin/blocks` | blocks.read |
| GET | `/admin/blocks/catalog` | blocks.read |
| POST | `/admin/blocks` | blocks.write |
| GET | `/admin/blocks/:id` | blocks.read |
| GET | `/admin/blocks/:id/usage` | blocks.read |
| PATCH | `/admin/blocks/:id` | blocks.write |
| DELETE | `/admin/blocks/:id` | blocks.delete |
| GET | `/admin/tariffs` | tariffs.read |
| GET | `/admin/tariffs/catalog` | tariffs.read |
| POST | `/admin/tariffs` | tariffs.write |
| GET | `/admin/tariffs/:id` | tariffs.read |
| PATCH | `/admin/tariffs/:id` | tariffs.write |
| DELETE | `/admin/tariffs/:id` | tariffs.delete |
| GET | `/admin/faqs` | faqs.read |
| POST | `/admin/faqs` | faqs.write |
| GET | `/admin/faqs/:id` | faqs.read |
| PATCH | `/admin/faqs/:id` | faqs.write |
| DELETE | `/admin/faqs/:id` | faqs.delete |
| GET | `/admin/formats` | formats.read |
| POST | `/admin/formats` | formats.write |
| GET | `/admin/formats/:id` | formats.read |
| PATCH | `/admin/formats/:id` | formats.write |
| DELETE | `/admin/formats/:id` | formats.delete |
| GET | `/admin/rules` | rules.read |
| GET | `/admin/rules/catalog` | rules.read |
| POST | `/admin/rules` | rules.write |
| GET | `/admin/rules/:id` | rules.read |
| PATCH | `/admin/rules/:id` | rules.write |
| DELETE | `/admin/rules/:id` | rules.delete |
| GET | `/admin/reviews` | reviews.read |
| GET | `/admin/reviews/catalog` | reviews.read |
| POST | `/admin/reviews` | reviews.write |
| GET | `/admin/reviews/:id` | reviews.read |
| PATCH | `/admin/reviews/:id` | reviews.write |
| PATCH | `/admin/reviews/:id/verify` | reviews.write |
| DELETE | `/admin/reviews/:id` | reviews.delete |
| GET | `/admin/leads` | leads.read |
| GET | `/admin/leads/:id` | leads.read |
| PATCH | `/admin/leads/:id` | leads.write |
| GET | `/admin/lead-categories` | leads.read |
| POST | `/admin/lead-categories` | leads.write |
| PATCH | `/admin/lead-categories/:id` | leads.write |
| DELETE | `/admin/lead-categories/:id` | leads.write |
| GET | `/admin/about-stat-categories` | about_stats.read |
| POST | `/admin/about-stat-categories` | about_stats.write |
| PATCH | `/admin/about-stat-categories/:id` | about_stats.write |
| DELETE | `/admin/about-stat-categories/:id` | about_stats.delete |
| GET | `/admin/about-stats` | about_stats.read |
| GET | `/admin/about-stats/catalog` | about_stats.read |
| POST | `/admin/about-stats` | about_stats.write |
| GET | `/admin/about-stats/:id` | about_stats.read |
| GET | `/admin/about-stats/:id/usage` | about_stats.read |
| PATCH | `/admin/about-stats/:id` | about_stats.write |
| DELETE | `/admin/about-stats/:id` | about_stats.delete |
| GET | `/admin/icon-groups` | icons.read |
| POST | `/admin/icon-groups` | icons.write |
| PATCH | `/admin/icon-groups/:id` | icons.write |
| DELETE | `/admin/icon-groups/:id` | icons.delete |
| GET | `/admin/icons/catalog` | icons.read |
| GET | `/admin/icons` | icons.read |
| POST | `/admin/icons/upload` | icons.write |
| POST | `/admin/icons` | icons.write |
| POST | `/admin/icons/bulk-delete` | icons.delete |
| GET | `/admin/icons/:id` | icons.read |
| PATCH | `/admin/icons/:id` | icons.write |
| DELETE | `/admin/icons/:id` | icons.delete |
| GET | `/admin/settings/media` | settings.read |
| PATCH | `/admin/settings/media` | settings.write |
| GET | `/admin/settings/presentations` | settings.read |
| PATCH | `/admin/settings/presentations` | settings.write |
| GET | `/admin/settings/contacts` | settings.read |
| PATCH | `/admin/settings/contacts` | settings.write |
| GET | `/admin/settings/mailings` | — |
| PATCH | `/admin/settings/mailings` | — |
| GET | `/admin/settings/branding` | settings.read |
| PATCH | `/admin/settings/branding` | settings.write |
| POST | `/admin/settings/branding/logo` | settings.write |
| POST | `/admin/settings/branding/favicon` | settings.write |
| GET | `/admin/mailings/stats` | admin panel |
| GET | `/admin/mailings/logs` | admin panel |
| GET | `/admin/mailings/tasks` | admin panel |
| GET | `/admin/mailings/cron-runs` | admin panel |

## Admin Curriculum — `/admin/curriculum`

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/levels`, `/levels/:id` | read/write/delete |
| GET/POST | `/courses`, `/courses/:id` | read/write/delete |
| GET/POST | `/units`, `/units/:id` | read/write/delete |
| GET/POST | `/lessons`, `/lessons/:id` | read/write/delete |
| POST/DELETE | `/lessons/:id/presentation` | curriculum.write |
| GET/POST/DELETE | `/accesses`, `/accesses/:id` | read/write |

## Admin Tests — `/admin/tests`

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/`, `/:id` | tests.read OR curriculum.read / tests.write |
| DELETE | `/:id` | tests.delete |
| GET | `/:id/stats`, `/:id/attempts`, `/:id/attempts/:attemptId` | read |

## Cabinet — `/cabinet`

| Method | Path | Role |
|--------|------|------|
| GET | `/cabinet/class` | teacher |
| GET | `/cabinet/class/students/:id` | teacher |
| GET | `/cabinet/lessons` | student/teacher |
| GET | `/cabinet/lessons/students/:studentId` | teacher |
| GET | `/cabinet/lessons/:id` | student/teacher |
| GET | `/cabinet/lessons/:id/slots` | student/teacher |
| POST | `/cabinet/lessons/:id/propose` | student/teacher |
| POST | `/cabinet/lessons/:id/accept` | student/teacher |
| POST | `/cabinet/lessons/:id/decline` | student/teacher |
| POST | `/cabinet/lessons/:id/freeze` | student/teacher |
| POST | `/cabinet/lessons/:id/complete` | student/teacher |
| POST | `/cabinet/lessons/:id/miss` | student/teacher |
| PATCH | `/cabinet/lessons/:id/content` | teacher |
| GET | `/cabinet/schedule` | student/teacher |
| PUT | `/cabinet/schedule/work` | student/teacher |
| POST | `/cabinet/schedule/busy` | student/teacher |
| DELETE | `/cabinet/schedule/:id` | student/teacher |
| GET | `/cabinet/tariffs` | student |
| POST | `/cabinet/tariffs/:id/select` | student |
| POST | `/cabinet/tariffs/scheduled/cancel` | student |
| GET | `/cabinet/reviews/teachers` | student |
| GET/POST | `/cabinet/reviews`, `/cabinet/reviews/:id` | student |
| GET | `/cabinet/library` | teacher |
| GET | `/cabinet/library/content/:type/:id` | teacher |
| GET/POST/PATCH/DELETE | `/cabinet/library/lessons/*` | teacher |
| GET/POST/PATCH/DELETE | `/cabinet/library/units/*` | teacher |
| GET | `/cabinet/tests/me/attempts` | student/teacher |
| GET | `/cabinet/tests/:id` | student/teacher |
| POST | `/cabinet/tests/:id/unlock` | student/teacher |
| POST | `/cabinet/tests/:id/attempts` | student/teacher |
| POST | `/cabinet/tests/attempts/:attemptId/submit` | student/teacher |
