# AdminPanel — Routes

← [AdminPanel](./README.md)

51 `page.tsx` files. `(panel)` не впливає на URL.

## Auth

| URL | File | Component |
|-----|------|-----------|
| `/login` | app/login/page.tsx | LoginForm |

## Panel

| URL | Component | Notes |
|-----|-----------|-------|
| `/` | DashboardView | dashboard.read |
| `/settings` | SettingsView | settings.read |

## Users & access

| URL | Component |
|-----|-----------|
| `/users` | UsersListView |
| `/users?role=student` | filter student |
| `/users?role=teacher` | filter teacher |
| `/users?role=admin,super_admin` | filter admins |
| `/users/[id]` | UserEditView |
| `/users/activity` | ActivityView |
| `/access-roles` | AccessRolesListView |
| `/access-roles/[id]` | AccessRoleEditView |
| `/analytics/users` | UsersAnalyticsView |

## Site CMS

| URL | Component |
|-----|-----------|
| `/pages` | PagesListView |
| `/pages/[id]` | PageEditView |
| `/pages/new` | → redirect /pages |
| `/blocks` | BlocksList |
| `/blocks/[id]` | BlockEditView |
| `/tariffs` | TariffsList |
| `/tariffs/[id]` | TariffEditView |
| `/faq` | FaqList |
| `/faq/[id]` | FaqEditView |

## Leads

| URL | Component |
|-----|-----------|
| `/leads` | LeadsListView |
| `/leads/[id]` | LeadEditView |
| `/leads/categories` | LeadCategoriesView |

## Media

| URL | Component |
|-----|-----------|
| `/icons` | IconsList |
| `/icons/[id]` | IconEditView |
| `/icons/groups` | IconGroupsView |
| `/images` | ImagesList |
| `/images/[id]` | ImageEditView |
| `/videos` | VideosList |
| `/videos/[id]` | VideoEditView |

## Content entities

| URL | Component |
|-----|-----------|
| `/about-stats` | AboutStatsList |
| `/about-stats/[id]` | AboutStatEditView |
| `/formats` | FormatsList |
| `/formats/[id]` | FormatEditView |
| `/rules` | RulesList |
| `/rules/[id]` | RuleEditView |
| `/reviews` | ReviewsList |
| `/reviews/[id]` | ReviewEditView |

## Materials

| URL | Component |
|-----|-----------|
| `/materials` | → /materials/lessons |
| `/materials/levels` | CurriculumView kind=levels |
| `/materials/levels/[id]` | ContentLevelEditView |
| `/materials/courses` | CurriculumView kind=courses |
| `/materials/courses/[id]` | ContentCourseEditView |
| `/materials/units` | CurriculumView kind=units |
| `/materials/units/[id]` | ContentUnitEditView |
| `/materials/lessons` | CurriculumView kind=lessons |
| `/materials/lessons/[id]` | ContentLessonEditView |
| `/materials/tests` | TestsListView |
| `/materials/tests/[id]` | TestEditView |
| `/materials/access` | AccessGrantView |
| `/tests` | → /materials/tests |
| `/tests/[id]` | → /materials/tests/[id] |

## Modules

| URL | Component |
|-----|-----------|
| `/modules/mailings` | MailingsModuleView (Suspense) |

## Layouts

| File | Role |
|------|------|
| app/layout.tsx | Root |
| app/(panel)/layout.tsx | AdminShell wrapper |
