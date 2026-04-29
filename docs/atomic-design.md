# Atomic Design — Frontend Component Architecture

## Overview

`apps/web/src/components/` follows a strict Atomic Design hierarchy. Every component file lives in exactly one tier. Import direction is one-way and never reversed:

```
Atoms  ←  Molecules  ←  Organisms  ←  Templates  ←  Pages
```

A tier may only import from tiers **below** it. No atom imports a molecule. No molecule imports an organism. Violations are a bug.

---

## Tier Rules

| Tier          | Path                    | What it may import                                                  |
| ------------- | ----------------------- | ------------------------------------------------------------------- |
| **Atoms**     | `components/atoms/`     | HTML elements + Tailwind classes only. No custom component imports. |
| **Molecules** | `components/molecules/` | Atoms only.                                                         |
| **Organisms** | `components/organisms/` | Molecules and/or atoms.                                             |
| **Templates** | `components/templates/` | Organisms, molecules, atoms.                                        |
| **Pages**     | `components/pages/`     | Anything below. Route-level components only.                        |

---

## Atoms

### `Button`

Generic button with 5 named variants.

```tsx
<Button variant="primary" onClick={handleSubmit} disabled={loading}>
  Save
</Button>

<Button variant="link-blue" className="mr-2" onClick={openEdit}>
  Edit
</Button>
```

| Prop        | Type                                                                | Default |
| ----------- | ------------------------------------------------------------------- | ------- |
| `variant`   | `'primary' \| 'secondary' \| 'danger' \| 'link-blue' \| 'link-red'` | none    |
| `className` | `string`                                                            | `''`    |
| `...rest`   | All `<button>` HTML props                                           | —       |

`variant` and `className` are **combined**, not exclusive. Variant sets the base style; `className` appends extra classes (e.g. spacing, width). When no `variant` is provided the button renders unstyled, relying entirely on `className`.

| Variant     | Visual                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| `primary`   | Blue filled (`bg-mgs-blue`), `hover:opacity-90`, `disabled:opacity-50` |
| `secondary` | Border only (`border-mgs-border`), text dim                            |
| `danger`    | Red filled (`bg-mgs-red`), `disabled:opacity-50`                       |
| `link-blue` | Text-only blue (`text-mgs-blue`), `disabled:opacity-40`                |
| `link-red`  | Text-only red (`text-mgs-red`)                                         |

---

### `Input`

Styled text input with a consistent base style.

```tsx
<Input value={name} onChange={(e) => setName(e.target.value)} required />;

{
  /* Override base style entirely */
}
<Input
  value={budget}
  onChange={(e) => setBudget(e.target.value)}
  className="font-mono text-right ..."
/>;
```

| Prop        | Behaviour                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `className` | When provided, **replaces** the default base style (not appended). Allows full overrides for special inputs like budget fields. |
| `...rest`   | All `<input>` HTML props forwarded.                                                                                             |

Default style: `w-full rounded-lg border border-mgs-border bg-mgs-card-alt px-3 py-2 text-xs text-mgs-text outline-none transition-colors placeholder:text-mgs-text-dim focus:border-mgs-blue`.

---

### `Label`

Form field label with optional required asterisk.

```tsx
<Label required>Name</Label>
<Label className="mb-2">Period</Label>
```

| Prop        | Type      | Default                  |
| ----------- | --------- | ------------------------ |
| `required`  | `boolean` | `false`                  |
| `className` | `string`  | Uses default label style |

Default style: `mb-1 block text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint`. When `className` is provided it replaces the default (same override behaviour as `Input`). When `required` is `true`, a `<span className="text-mgs-red ml-0.5">*</span>` is appended inside the label.

---

### `Badge`

Thin `<span>` wrapper for status pills, date labels, and similar inline labels.

```tsx
<Badge className="rounded-full bg-mgs-green/10 text-mgs-green-light px-2 py-0.5 text-[10px] font-semibold uppercase">
  Yes
</Badge>
```

| Prop        | Type                  |
| ----------- | --------------------- |
| `className` | `string`              |
| `style`     | `React.CSSProperties` |
| `children`  | `React.ReactNode`     |

No default style — always provide `className`. Enforces the correct `<span>` element (not a `<div>` or `<p>`).

---

### `Alert`

Error and status message block with 3 size variants.

```tsx
{
  formError && <Alert variant="inline">{formError}</Alert>;
}

{
  data.error && <Alert variant="section">{data.error}</Alert>;
}

{
  pageError && <Alert variant="page">Error loading data: {pageError}</Alert>;
}
```

| Variant   | Container style                                                           | Text size | Use case                                       |
| --------- | ------------------------------------------------------------------------- | --------- | ---------------------------------------------- |
| `inline`  | `rounded-lg border border-mgs-red/30 bg-mgs-red/10 px-3 py-2`             | `text-xs` | Form validation errors inline in a modal/panel |
| `section` | `rounded-xl border border-mgs-red/30 bg-mgs-red/10 px-4 py-6 text-center` | `text-xs` | Panel or widget-level data failure             |
| `page`    | `rounded-xl border border-mgs-red/30 bg-mgs-red/10 p-6 text-center`       | `text-sm` | Full-page data load failure                    |

All variants use `text-mgs-red-light` text color.

---

### `Spinner`

SVG circular animation for loading states.

```tsx
<Spinner />                                   {/* default: h-4 w-4 animate-spin */}
<Spinner className="h-3 w-3 animate-spin" />  {/* custom size */}
<Spinner className="h-4 w-4 animate-spin text-mgs-amber" /> {/* custom color */}
```

| Prop        | Default                  |
| ----------- | ------------------------ |
| `className` | `'h-4 w-4 animate-spin'` |

Renders a two-path SVG (faint circle track + solid arc). Color inherits from `currentColor`.

---

### `TableHeader`

Thin `<th>` wrapper. Enforces the correct table header element while allowing full style customization.

```tsx
<TableHeader className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.8px] text-mgs-text-faint">
  Project
</TableHeader>
```

No default style — always provide `className`. Within organisms, a local `Th` helper wraps `<TableHeader>` with the table-specific padding/tracking:

```tsx
// Inside each organism — keeps call sites clean
function Th({ children, className = '' }) {
  return (
    <TableHeader
      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.8px] text-mgs-text-faint ${className}`}
    >
      {children}
    </TableHeader>
  );
}
```

---

### `LegendItem`

Color dot + label row for chart legends.

```tsx
<LegendItem color="#3b82f6" label="Contracted" />
<LegendItem color="#10b981" label="Used" className="text-[11px]" />
```

| Prop        | Type     | Default                                                                                  |
| ----------- | -------- | ---------------------------------------------------------------------------------------- |
| `color`     | `string` | required                                                                                 |
| `label`     | `string` | required                                                                                 |
| `className` | `string` | `'flex items-center gap-[5px] text-[11px] uppercase tracking-wider text-mgs-text-muted'` |

The color dot is a `10×10px` `<span>` with `borderRadius: 3px` and `backgroundColor: color`.

---

### Other atoms

| Atom       | Description                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `Header`   | Page title + subtitle + badge. Used at the top of every page.                                    |
| `StatCard` | Metric tile with label, value, unit, and optional alert badge.                                   |
| `Modal`    | Overlay dialog. Closes on backdrop click or Escape. Uses `Button` atom for the close `×` button. |
| `Skeleton` | Loading placeholder shapes: `StatCardSkeleton`, `ChartSkeleton`, `TableSkeleton`.                |

---

## Molecules

### `ConfirmDialog`

Reusable delete confirmation pattern. Composes `Modal` + two `Button` atoms.

```tsx
<ConfirmDialog
  open={!!deleting}
  onClose={() => setDeleting(null)}
  onConfirm={handleDelete}
  title="Delete Project"
  message={
    <>
      Delete <strong>{deleting?.name}</strong>? This cannot be undone.
    </>
  }
  loading={deleteLoading}
/>
```

| Prop           | Type         | Default         |
| -------------- | ------------ | --------------- |
| `open`         | `boolean`    | required        |
| `onClose`      | `() => void` | required        |
| `onConfirm`    | `() => void` | required        |
| `title`        | `string`     | required        |
| `message`      | `ReactNode`  | required        |
| `confirmLabel` | `string`     | `'Delete'`      |
| `loadingLabel` | `string`     | `'Deleting...'` |
| `loading`      | `boolean`    | `false`         |

Renders: Modal → message paragraph → `Button variant="secondary"` (Cancel) + `Button variant="danger"` (Confirm).

Used by: `DeveloperPanel`, `ProjectPanel`, `ComponentPanel`.

---

### `DeveloperForm` / `ProjectForm`

Create + edit forms. Both use `Label`, `Input`, `Button`, and `Alert` atoms.

```tsx
<DeveloperForm
  initial={editingDev} // null = create mode, object = edit mode
  onSave={handleSave}
  onCancel={() => setModalOpen(false)}
/>
```

Both forms:

- Show `<Alert variant="inline">` on API error
- Use `<Label required>` for required fields
- Use `<Input>` for text fields (budget uses `className` override for `font-mono text-right`)
- Use `Button variant="secondary"` (Cancel) + `Button variant="primary"` (Save/Update)

---

### `MonthPicker`

Month navigation with prev/next arrows. Uses `Button` (nav arrows) and `Badge` (month label).

```tsx
<MonthPicker />  {/* reads/writes ?month= URL param via useMonth hook */}
```

Forward arrow is disabled for future months.

---

### `ColdStartBanner`

Fixed-position banner shown while the Koyeb free-tier API is waking up. Uses `Spinner` atom.

```tsx
{
  /* Mounted once at root level in App.tsx */
}
<ColdStartBanner />;
```

States: `waking` (amber, spinner + message) → `ready` (auto-dismisses) → `failed` (red error).

---

### `Toast`

Auto-dismiss notification (3.5s). Callback-based — callable from anywhere without React context.

```tsx
showToast('Developer saved');
showToast('Delete failed', 'error');
```

`ToastContainer` is mounted once in `App.tsx`. Green = success, red = error.

---

## Organisms

Self-contained feature blocks. Each renders a full section of the UI and manages its own local state (open modals, loading flags, form errors).

| Organism                 | Description                                                               | Key atoms/molecules                                                          |
| ------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ClientHoursChart`       | Bar chart + legend for budget vs hours                                    | `LegendItem`                                                                 |
| `DeveloperWorkloadChart` | Horizontal stacked bar chart                                              | `LegendItem`                                                                 |
| `ReportChart`            | Custom report bar chart                                                   | `LegendItem`                                                                 |
| `ClientTable`            | Budget vs hours table with progress bars                                  | `TableHeader`                                                                |
| `DeveloperTable`         | Developer hours table with % bars                                         | `TableHeader`                                                                |
| `DeveloperPanel`         | Full developer CRUD (list + add/edit/delete)                              | `Button`, `TableHeader`, `ConfirmDialog`, `DeveloperForm`                    |
| `ProjectPanel`           | Full project CRUD                                                         | `Button`, `TableHeader`, `ConfirmDialog`, `ProjectForm`                      |
| `ComponentPanel`         | Full component CRUD                                                       | `Button`, `Input`, `Label`, `Badge`, `TableHeader`, `Alert`, `ConfirmDialog` |
| `TrashPanel`             | Soft-delete restore table                                                 | `Button`, `Badge`, `TableHeader`, `Alert`                                    |
| `FilterForm`             | Custom report filter controls (period, date, project/dev multi-select)    | `Label`, `Button`                                                            |
| `DetailsPanel`           | Drill-down table for custom reports (category tabs, sub-tabs, pagination) | `Button`                                                                     |
| `DownloadMenu`           | Export dropdown (Chart HTML + Excel)                                      | `Button`                                                                     |

---

## Templates

### `AppShell`

Top nav bar + page content wrapper. Contains: logo, nav tabs (`NavLink`), `ThemeToggle`, `SyncButton`, `MonthPicker`.

Uses `Button` (ThemeToggle, SyncButton) and `Spinner` (SyncButton loading state).

`MonthPicker` is hidden on `/manage` and `/reports/custom` routes (detected via `useLocation()`).

---

## Pages

Route-level components. Import organisms/templates; do minimal local logic.

| Page              | Route             | Key organisms                                                    |
| ----------------- | ----------------- | ---------------------------------------------------------------- |
| `Dashboard`       | `/`               | `ClientHoursChart`, `ClientTable`, `StatCard`                    |
| `DeveloperReport` | `/developers`     | `DeveloperWorkloadChart`, `DeveloperTable`, `StatCard`           |
| `Manage`          | `/manage`         | `DeveloperPanel`, `ProjectPanel`, `ComponentPanel`, `TrashPanel` |
| `CustomReports`   | `/reports/custom` | `FilterForm`, `ReportChart`, `DetailsPanel`, `DownloadMenu`      |

All pages use `<Alert variant="page">` for top-level data load failures and `<Header>` for the page title block.

`Manage` renders four tabs (Developers / Projects / Components / Trash) using `Button` atoms for tab switchers and `Alert variant="section"` for per-panel errors.

---

## Adding a New Component

1. **Decide the tier** — if it uses only HTML + Tailwind, it's an atom. If it composes atoms, it's a molecule. If it's a feature block with its own state, it's an organism.
2. **Create the folder** — `components/<tier>/<ComponentName>/`
3. **Create the file** — `<ComponentName>.tsx`, named export only (no default exports).
4. **Check imports** — the file may only import from tiers below it. Run `npx tsc --noEmit` to confirm zero type errors.
5. **If an HTML element is used in 3+ components** — extract it as an atom first.
