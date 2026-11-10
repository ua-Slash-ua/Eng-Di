# AdminPanel — Components, Lib, Hooks

← [AdminPanel](./README.md)

## `components/ui/`

| Component | Exports | Purpose |
|-----------|---------|---------|
| ColumnFilterCell | ColumnFilter, ColumnFilterCell | Table column filters |
| ConfirmModal | ConfirmModal | Delete confirm dialog |
| CreateButton | CreateModalControl, CreateButton | Generic create modal |
| DataTable | Column, DataTable, TablePager, … | Full admin table |
| FormAlerts | LoadingState, LoadError, FormAlerts | Form feedback |
| MultiSelect | MultiSelect | UI multi-select |
| PageHead | PageHead | Page title + back + actions |
| Pager | Pager | Simple pager |
| RecordActionsMenu | RecordActionsMenu | Row actions dropdown |
| SearchField | SearchField | Search input |
| Select | SelectOption, Select | Single select; **searchable** prop |
| SvgIcon | SvgIcon | Inline SVG render |

## `components/fields/`

| Component | Purpose |
|-----------|---------|
| ButtonField | Label + URL pair (CTA) |
| FieldCard | Form section card |
| IconPicker | Pick from icon catalog |
| ImagePicker | Media library picker |
| MultiSelect | Form multi-select with chips |
| RepeaterField | Dynamic row repeater |
| SvgIconField | SVG textarea + preview |

## `lib/`

| File | Key exports |
|------|-------------|
| api.ts | api(), onUnauthorized, re-exports permissions |
| auth.tsx | AuthProvider, useAuth |
| duplicate.ts | withCopyLabel, withCopySlug, withCopyEmail |
| format.ts | initials, greeting, formatUah, formatBytes, pagePath |
| nav.ts | NavGroup, nav, filterNav, groupHasActive |
| pagination.ts | Paginated, ListParams, listQuery |
| permissions.ts | User, hasPermission, canAccessAdminPanel, formatUserAccess |
| svgIcon.ts | sanitizeSvg, resolveIcon, ICONS, EMOJI_TO_SVG |
| uiStorage.ts | Page size, media view mode persistence (localStorage) |

## `hooks/`

| Hook | Purpose |
|------|---------|
| useConfirmDelete | Delete with optional usage check |
| useDebouncedValue | Debounce (300ms default) |
| useDirtyForm | Unsaved changes warning |
| useMediaViewMode | Grid/list for media pages |
| usePaginatedList | URL-synced paginated fetch |
| useResource | Single resource by path |
| useRowSelection | Checkbox multi-select |
| useSaveFeedback | Save success/error messages |
| useTableQuery | URL search/sort/page/filters |
| useUiStorage | Subscribe to uiStorage |

## Select.tsx — searchable mode

Prop `searchable`:
- Renders search input inside dropdown
- Filters options by label + **hint** (used in TestEditView for «Урок», «Курс» labels)

## DataTable pattern

Typical list page:
1. `useTableQuery()` — URL state
2. `usePaginatedList(fetcher)` — data
3. `<DataTable columns={...} />` — render

## Permission check pattern

```typescript
if (!hasPermission(user, 'users.write')) return null;
```

Sidebar uses `filterNav(user)` automatically.
