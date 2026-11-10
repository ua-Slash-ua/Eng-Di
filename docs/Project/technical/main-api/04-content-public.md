# MainApi — Public Content

← [MainApi](./README.md)

## PublicContentController — `/api`

No guards. Used by UserPanel SSR and public fetches.

| Method | Path | Service | Response |
|--------|------|---------|----------|
| GET | `/about-stats` | AboutStatsService.list | Stat cards |
| GET | `/formats` | FormatsService.list | Formats |
| GET | `/tariffs` | TariffsService.list | Tariff plans |
| GET | `/rules` | RulesService.list | School rules |
| GET | `/faqs` | FaqsService.list | FAQ list |
| GET | `/reviews` | ReviewsService.listPublic | Verified reviews |
| GET | `/blocks` | BlocksService.listPublic | Block list |
| GET | `/blocks/:id` | BlocksService.findById + presentPublic | Resolved block |
| GET | `/pages/:slug` | PagesService.findBySlug | Page + sections + blocks |
| POST | `/leads` | LeadsService.create | CreateLeadDto |

## PublicSettingsController

| Method | Path |
|--------|------|
| GET | `/settings/contacts` |
| GET | `/settings/branding` |

## UserPanel loaders (`lib/`)

| File | Fetches |
|------|---------|
| loadHomePage.ts | `/api/pages/home` + aggregates |
| about-stats.ts | `/api/about-stats` |
| formats.ts | `/api/formats` |
| tariffs.ts | `/api/tariffs` |
| rules.ts | `/api/rules` |
| reviews.ts | `/api/reviews` |
| branding.ts | `/api/settings/branding` |
| contacts.ts | `/api/settings/contacts` |
| blocks.ts | Individual block endpoints + fallbacks |

**API_URL (SSR):** `API_INTERNAL_URL` → `MAIN_API_URL` → localhost:4000

## LeadForm

POST `/api/leads` with `{ name, phone, email?, message?, category?, location? }`

Category matched by slug from block meta or default.
