# MainApi — Pages & Blocks

← [MainApi](./README.md)

## Pages

**Service:** PagesService  
**Controller:** AdminPagesController — `/api/admin/pages`

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/pages` | read/write |
| GET/PATCH/DELETE | `/pages/:id` | read/write/delete |
| POST | `/pages/:id/sections` | pages.write — AttachPageSectionDto |
| PATCH | `/pages/:id/sections/reorder` | ReorderPageSectionsDto |
| DELETE | `/page-sections/:id` | Detach section |

**PagesService methods:** list, findBySlug, findById, create, update, remove, attachSection, reorderSections, detachSection, usageByBlock

**DTOs:** CreatePageDto (slug!, title!), UpdatePageDto (+ seo?), PageSeoDto, AttachPageSectionDto (blockId!), ReorderPageSectionsDto (sectionIds!)

Public: GET `/api/pages/:slug` — resolved page with sections + blocks for UserPanel SSR.

---

## Blocks

**Service:** BlocksService  
**Controller:** AdminBlocksController — `/api/admin/blocks`

| Method | Permission |
|--------|------------|
| GET list, catalog | blocks.read |
| POST create | blocks.write |
| GET :id, usage | blocks.read |
| PATCH :id | blocks.write |
| DELETE :id | blocks.delete |

**Block types** (`block-types.ts`): hero, about, levels, formats, pricing, rules, reviews, cta, lead

**BlocksService:** list, catalog, listAdmin, listPublic, findById, create, update, remove, usage, usageByRecord, presentPublic

**Block meta:** key-value in BlockMeta table — configured per type in AdminPanel *BlockFields components.

Public: GET `/api/blocks`, `/api/blocks/:id`
