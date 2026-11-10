# UserPanel — Lib & Components

← [UserPanel](./README.md)

## `lib/`

| File | Exports | Purpose |
|------|---------|---------|
| api.ts | api(), onUnauthorized, canAccessUserPanel, cabinetBasePath | Client fetch, X-EngDi-Panel: user |
| auth.tsx | AuthProvider, useAuth | Session, login, profile, avatar, password |
| roles.ts | User, UserPanelRole, canAccessUserPanel, cabinetBasePath | Role helpers |
| page.ts | API_URL | Server-side base URL chain |
| blocks.ts | SiteBlock, fetchHeroBlock, fetchPricingBlock, … | CMS block fetchers + fallbacks |
| about-stats.ts | AboutStat, fetchAboutStats, statsByCategory | Homepage stats |
| branding.ts | SiteBranding, fetchBranding | Logo/favicon |
| contacts.ts | SiteContacts, fetchContacts | Footer contacts |
| formats.ts | Format, fetchFormats, formatAccentClass | Formats section |
| reviews.ts | Review, fetchReviews, starLabel | Reviews |
| rules.ts | SchoolRule, fetchRules, ruleAccentClass | Rules |
| tariffs.ts | Tariff, fetchTariffs, formatUah, discountPercent | Pricing |
| svgIcon.ts | sanitizeSvg, resolveIcon, ICONS | Icon registry |

### API_URL resolution (SSR)

`API_INTERNAL_URL` → `MAIN_API_URL` → `http://localhost:4000`

### api.ts refresh skip paths

/login, /refresh, /logout, /forgot-password, /reset-password, /me, /password

---

## `components/ui/`

| Component | Purpose |
|-----------|---------|
| Section | Page section wrapper |
| SectionHead | Eyebrow + title header |
| EyebrowTag | Small label tag |
| SvgIcon | Sanitized inline SVG |

## `components/site/`

| Component | Purpose |
|-----------|---------|
| SiteBrand | Logo or text |
| SiteHeader | Nav anchors, auth links, mobile menu |
| SiteFooter | Contacts, socials |

## `components/auth/`

| Component | Purpose |
|-----------|---------|
| AuthShell | Centered auth card layout |

## Root components

| Component | Purpose |
|-----------|---------|
| PageAnalytics | POST /api/auth/page-view on route change |

---

## Auth context (`useAuth`)

| Field/Method | Опис |
|--------------|------|
| user | PublicUser or null |
| loading | Initial /me fetch |
| login(email, password) | POST login → redirect cabinet |
| logout() | POST logout |
| refresh() | Reload /me |
| updateProfile(dto) | PATCH profile |
| uploadAvatar(file) | POST multipart |
| removeAvatar() | POST remove |
| changePassword(dto) | PATCH password |

---

## globals.css notes

- Site + cabinet styles
- `.take-test` scope fixes radio `width: 100%` global bug
- Cabinet rail, schedule grid, lesson tiles

---

## Data flow diagram

```
SSR (public):
  loadHomePage() → fetch(API_URL + '/api/...') → render

CSR (cabinet):
  Component → lib/api.ts → /api/proxy → MainApi
```
