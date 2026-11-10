# AdminPanel — Features (повний)

← [AdminPanel](./README.md)

## `features/about-stats/`

**api:** `aboutStatsApi` — list, catalog, get, create, update, remove, usage  
**types:** AboutStatListItem, AboutStatItem, AboutStatUsage, BLOCK_TYPE_LABELS  
**components:** AboutStatsList, AboutStatEditView, CreateAboutStatButton

---

## `features/access-roles/`

**api:** accessRolesApi — permissions, list, get, create, update, remove  
**types:** PermissionItem, AdminRoleItem  
**components:** AccessRolesListView, AccessRoleEditView

---

## `features/analytics/`

**components:** UsersAnalyticsView — authAdminApi overview/summary/events

---

## `features/auth/`

**components:** LoginForm — useAuth().login

---

## `features/blocks/`

**api:** blocksApi — list, get, create, update, remove, usage + catalog helpers  
**types:** BlockListItem, BlockItem, BlockType, LevelItem, FormatCardItem, parseStatIds, …  
**components:**

| Component | Block type |
|-----------|------------|
| HeroBlockFields | hero |
| AboutBlockFields | about |
| LevelsBlockFields | levels |
| FormatsBlockFields | formats |
| PricingBlockFields | pricing |
| RulesBlockFields | rules |
| ReviewsBlockFields | reviews |
| CtaBlockFields | cta |
| LeadBlockFields | lead |
| BlocksList | list |
| BlockEditView | editor shell |
| CreateBlockButton | modal |

---

## `features/curriculum/`

**api:** curriculumApi — levels/courses/units/lessons CRUD + presentation upload + accesses  
**types:** ContentLevel, ContentCourse, ContentUnit, ContentLesson, TeacherAccess, LessonPresentation  
**lib/grantTree.ts:** GrantTreeNode, entityTypeLabel, expandAccessGrant, countTreeNodes  
**components:** CurriculumView, Content*EditView (4), LessonPresentationField, AccessGrantView

---

## `features/dashboard/`

**components:** DashboardView — admin stats + auth summary

---

## `features/faq/`

**api:** faqsApi — CRUD  
**components:** FaqList, FaqEditView, CreateFaqButton

---

## `features/formats/`

**api:** formatsApi — CRUD  
**types:** ACCENT_LABELS, ACCENT_OPTIONS  
**components:** FormatsList, FormatEditView, CreateFormatButton

---

## `features/icons/`

**api:** iconsApi, iconGroupsApi — full media CRUD + upload + bulk delete  
**types:** MediaType, IconItem, IconCatalogItem, UploadMetaItem, …  
**components:** IconsList, ImagesList, VideosList, Icon/Image/Video EditView, IconGroupsView, MediaGrid, MediaBulkBar, MediaPreviewModal, UploadImagesButton, CreateIconButton, CreateIconGroupButton, MediaViewToggle

---

## `features/leads/`

**api:** leadsApi, leadCategoriesApi  
**types:** LeadStatus, LEAD_STATUS_TABS, …  
**components:** LeadsListView, LeadEditView, LeadCategoriesView, CreateLeadCategoryButton

---

## `features/modules/`

**api:** mailingsApi — getSettings, updateSettings, stats, logs, tasks, cronRuns  
**types:** MailingType, MailingSettings, MailingLog, MailingTask, MailingCronRun, MAILING_TYPE_OPTIONS  
**components:** MailingsModuleView, MailingsAnalytics, MailingsLogsTable, MailingsCronView

---

## `features/pages/`

**api:** pagesApi — CRUD + attachSection, reorderSections, detachSection, blocksCatalog  
**types:** PageRow, PageSection, PageItem, BlockCatalogItem, PageSeo  
**components:** PagesListView, PageEditView, PageSectionsPanel, CreatePageButton

---

## `features/reviews/`

**api:** reviewsApi — list, get, create, update, verify, remove  
**types:** ReviewKind, ReviewTarget, RATING_OPTIONS, VERIFIED_OPTIONS  
**components:** ReviewsList, ReviewEditView, CreateReviewButton

---

## `features/rules/`

**api:** rulesApi — CRUD  
**components:** RulesList, RuleEditView, CreateRuleButton

---

## `features/settings/`

**api:** settingsApi — media, presentations, contacts, branding, uploadLogo, uploadFavicon  
**types:** MediaSettings, ContactsSettings, BrandingSettings, PresentationSettings, …  
**components:** SettingsView (tabbed)

---

## `features/shell/`

**components:** AdminShell (sidebar+topbar), getTopbarTitle(pathname)

---

## `features/tariffs/`

**api:** tariffsApi — CRUD  
**types:** VARIANT_LABELS, DURATION_OPTIONS  
**components:** TariffsList, TariffEditView, CreateTariffButton

---

## `features/tests/`

**api:** testsApi — list, get, create, update, remove, stats, attempts, attemptDetail  
**types:** TestKind, TestAccessDuration, TestQuestion, TestAttemptReview, DURATION_LABELS, KIND_LABELS  
**components:** TestsListView, TestEditView (searchable material Select)

---

## `features/users/`

**api:** usersApi — full user admin + tariffs + lessons + class  
**api:** authAdminApi — summary, overview, events, sessions, logoutAll, revokeSession  
**types:** User, UserTariffRecord, AdminLesson, AuthEvent, AuthOverview, ROLE_TABS, …  
**components:** UsersListView, UserEditView, CreateUserButton, UserMaterialsPanel, UserClassPanel, ActivityView

---

## Nav (`lib/nav.ts`) — id → items

| Group id | Label | Key routes |
|----------|-------|------------|
| overview | Огляд | /, /settings |
| users | Користувачі | /users, /access-roles |
| analytics | Аналітика | /analytics/users |
| site | Сайт | /pages, /tariffs, /blocks, /faq |
| leads | Заявки | /leads, /leads/categories |
| media | Медіа | /icons, /images, /videos, /icons/groups |
| content | Контент | /about-stats, /formats, /rules, /reviews |
| curriculum | Матеріали | /materials/*, /materials/tests, /materials/access |
| modules | Модулі | /modules/mailings |

Permission on item: string or string[] (OR). `filterNav` hides unauthorized.
