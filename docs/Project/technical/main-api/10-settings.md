# MainApi — Settings

← [MainApi](./README.md)

## Settings storage

Table `Setting`: key (unique), value (Json).

## Domains

### Media (`media-settings.ts`)

| Field | Опис |
|-------|------|
| imageFormats | Allowed extensions[] |
| videoFormats | Allowed extensions[] |
| maxImageMb | Upload limit |
| maxVideoMb | Upload limit |

Used by IconsService.uploadImages validation.

### Presentations (`presentation-settings.ts`)

| Field | Опис |
|-------|------|
| formats | pdf, pptx, … |
| maxMb | Max file size |

Used by LessonPresentationsService.

### Contacts (`contact-settings.ts`)

| Field | Опис |
|-------|------|
| email | School email |
| phone | Phone |
| socials | [{ label, url }] |

Public: GET `/api/settings/contacts` → UserPanel footer.

### Branding (`branding-settings.ts`)

| Field | Опис |
|-------|------|
| logoUrl | /uploads/... |
| faviconUrl | /uploads/... |

POST upload logo/favicon — multipart, stored in uploads/branding/.

Public: GET `/api/settings/branding` → SiteHeader, metadata.

### Mailings (`mailing-settings.ts`)

SMTP host/port/user/password, enabled flags, templates per MailingType.

Used by MailingsMailerService.

## SettingsService methods

For each domain: `get*Settings()`, `get*SettingsPayload()`, `update*Settings(dto)`  
Plus: `uploadBrandingFile(kind, file)`, `isMailingEnabled(settings, type)`

## Admin routes

`/api/admin/settings/media|presentations|contacts|mailings|branding`  
Permissions: settings.read / settings.write (mailings: none)

## AdminPanel

SettingsView — tabbed editor for all domains.

## UserPanel consumers

- `(public)/layout.tsx` — contacts, branding
- `AuthShell` — logo
- `app/layout.tsx` — dynamic metadata title/favicon
