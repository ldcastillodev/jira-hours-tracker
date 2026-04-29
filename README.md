# MgS — Client Hours Report

Time-tracking reporting system migrated from Google Sheets to a production-grade web application.

## Tech Stack

| Layer | Technology | Deploy Target |
|-------|-----------|---------------|
| Monorepo | Turborepo + npm workspaces | — |
| Frontend | React 19 + Vite + Tailwind CSS v4 + Chart.js | Vercel |
| Backend | NestJS 11 | Koyeb (free tier) |
| Database | PostgreSQL (Neon/Supabase) via Prisma ORM | — |

## Project Structure

```
mgs-clients/
├── apps/
│   ├── api/                        # NestJS backend
│   │   ├── Dockerfile              # Multi-stage Docker build for Koyeb
│   │   ├── Procfile                # Koyeb buildpack entrypoint
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── health/         # GET /health (cold start check)
│   │       │   ├── projects/       # Project CRUD + budget
│   │       │   ├── developers/     # Developer management
│   │       │   ├── worklogs/       # Worklog CRUD
│   │       │   ├── reports/        # Aggregated report endpoints
│   │       │   └── jira-sync/      # Jira API proxy + upsert
│   │       └── prisma/             # PrismaService (injectable)
│   │
│   └── web/                        # React frontend
│       ├── vercel.json             # SPA rewrites for Vercel
│       └── src/
           ├── components/         # Atomic Design hierarchy
           │   ├── atoms/          # Primitives (HTML + Tailwind only)
           │   │   ├── Alert/      # Inline / section / page error variants
           │   │   ├── Badge/      # Span wrapper with className passthrough
           │   │   ├── Button/     # 5 variants: primary, secondary, danger, link-blue, link-red
           │   │   ├── Header/     # Page title + subtitle + badge
           │   │   ├── Input/      # Styled text input
           │   │   ├── Label/      # Form label with optional required asterisk
           │   │   ├── LegendItem/ # Color dot + label for charts
           │   │   ├── Modal/      # Overlay dialog (uses Button atom)
           │   │   ├── Skeleton/   # Loading placeholder shapes
           │   │   ├── Spinner/    # SVG animate-spin loader
           │   │   ├── StatCard/   # Metric tile with label/value/unit
           │   │   └── TableHeader/# <th> wrapper with className passthrough
           │   ├── molecules/      # Atoms composed together
           │   │   ├── ColdStartBanner/ # Waking-server banner (Spinner + text)
           │   │   ├── ConfirmDialog/   # Modal + Cancel/Confirm buttons
           │   │   ├── DeveloperForm/   # Create/edit developer (Input, Label, Button, Alert)
           │   │   ├── MonthPicker/     # Month nav arrows (Button + Badge)
           │   │   ├── ProjectForm/     # Create/edit project (same atom set)
           │   │   └── Toast/           # Auto-dismiss notification
           │   ├── organisms/      # Feature blocks (molecules + atoms)
           │   │   ├── ClientHoursChart/      # Bar chart with LegendItem atoms
           │   │   ├── ClientTable/           # Budget vs hours table
           │   │   ├── ComponentPanel/        # Component CRUD table
           │   │   ├── DetailsPanel/          # Custom report drill-down
           │   │   ├── DeveloperPanel/        # Developer CRUD table
           │   │   ├── DeveloperTable/        # Developer hours table
           │   │   ├── DeveloperWorkloadChart/# Horizontal stacked bar chart
           │   │   ├── DownloadMenu/          # Export dropdown (HTML + XLSX)
           │   │   ├── FilterForm/            # Custom report filter controls
           │   │   ├── ProjectPanel/          # Project CRUD table
           │   │   ├── ReportChart/           # Custom report bar chart
           │   │   └── TrashPanel/            # Soft-delete restore table
           │   ├── templates/      # Page layout wrappers
           │   │   └── AppShell/   # Nav bar + page container (Button, Spinner)
           │   └── pages/          # Route-level components
           │       ├── CustomReports/ # Custom report builder
           │       ├── Dashboard/     # Project hours overview
           │       ├── DeveloperReport/ # Developer workload overview
           │       └── Manage/        # CRUD management UI
           ├── hooks/              # useApi, useMonth, useConnectionStatus, useTheme
│           └── services/           # API client (retry + cold start detection)
│
├── packages/
│   ├── db/                         # Prisma schema + generated client
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── shared/                     # Shared TypeScript DTOs
│       └── src/dto/
│
├── turbo.json
├── docker-compose.yml              # Local PostgreSQL (Docker)
├── package.json
└── .env.example
```

## Quick Start (Local con Docker)

> **Requisitos**: Node.js ≥ 20, Docker Desktop

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar PostgreSQL local

```bash
docker compose up -d
```

Esto inicia un contenedor PostgreSQL 16 en `localhost:5432` con:
- **User**: `mgs`
- **Password**: `mgs_local`
- **Database**: `mgs_clients`

Los datos persisten en un volumen Docker (`pgdata`).

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Para desarrollo local con Docker, usa estos valores en `.env`:

```env
DATABASE_URL="postgresql://mgs:mgs_local@localhost:5432/mgs_clients"
API_PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

> Las variables de Jira (`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`) solo son necesarias si vas a usar el sync con Jira. Para datos de prueba, el seed es suficiente.

### 4. Generar Prisma Client y crear tablas

```bash
npx prisma generate --schema=packages/db/prisma/schema.prisma
npx prisma db push --schema=packages/db/prisma/schema.prisma
```

### 5. Seedear datos de prueba

```bash
cd packages/db && npx ts-node prisma/seed.ts && cd ../..
```

El seed crea:
- **15 proyectos** (clientes reales: Tishman Studio, Kraft Heinz, EF Tours, etc.) con presupuestos mensuales
- **6 developers** (Sample Developer, María López, Carlos García, Ana Martínez, Luis Castillo, Sofía Rivera)
- **~400+ worklogs** distribuidos en el mes actual y el anterior — horas variadas (0.5–4h), ~80% billable, repartidos entre los 15 proyectos

### 6. Iniciar servidores de desarrollo

```bash
npm run dev
```

Esto arranca ambos servers vía Turborepo:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | `http://localhost:5173` | React + Vite (hot reload) |
| API | `http://localhost:3001` | NestJS (watch mode) |
| Health | `http://localhost:3001/health` | Verificar que la API está viva |

El frontend proxea `/api/*` → `localhost:3001` automáticamente en dev.

### Comandos útiles

```bash
# Re-seedear datos (borra worklogs anteriores y genera nuevos)
cd packages/db && npx ts-node prisma/seed.ts && cd ../..

# Abrir Prisma Studio (UI visual de la DB)
npx prisma studio --schema=packages/db/prisma/schema.prisma

# Parar PostgreSQL
docker compose down

# Parar y borrar datos
docker compose down -v
```

## Data Model

Three core models replicate the Google Sheets structure:

- **Project** — Self-referencing hierarchy. Top-level (`parentId: null`) = clients with `monthlyBudget`. Children = components.
- **Developer** — Team members with optional `jiraAccountId` for Jira sync and `slackId`.
- **Worklog** — Time entries linking a developer to a project on a date. `isBillable` flag, `jiraIssueId` for upsert matching.

## API Endpoints

### Projects
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects` | List all top-level projects with children |
| `GET` | `/projects/:id` | Get single project with children + parent |
| `POST` | `/projects` | Create project (`name`, `monthlyBudget?`, `parentId?`) |
| `PUT` | `/projects/:id` | Update project fields |
| `PATCH` | `/projects/:id` | Partial update project fields |
| `DELETE` | `/projects/:id` | Delete project (409 if has worklogs or children) |

### Developers
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/developers` | List all developers |
| `GET` | `/developers/:id` | Get single developer |
| `POST` | `/developers` | Create developer (`name`, `email`, `jiraAccountId?`, `slackId?`) |
| `PUT` | `/developers/:id` | Update developer fields |
| `PATCH` | `/developers/:id` | Partial update developer fields |
| `DELETE` | `/developers/:id` | Delete developer (409 if has worklogs) |

### Worklogs
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/worklogs?month=YYYY-MM` | List worklogs, optionally filtered by month |
| `GET` | `/worklogs/:id` | Get single worklog with project + developer |
| `POST` | `/worklogs` | Create worklog (`date`, `hours`, `projectId`, `developerId`, `isBillable?`, `jiraIssueId?`) |
| `PUT` | `/worklogs/:id` | Update worklog fields |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/reports/client-hours?month=YYYY-MM` | Budget vs consumption per client |
| `GET` | `/reports/developer-workload?month=YYYY-MM` | Billable vs non-billable per developer |
| `GET` | `/reports/client-summary?month=YYYY-MM` | Component hours grouped by parent client |
| `GET` | `/reports/daily?date=YYYY-MM-DD` | Developer → component → hours for a single day |

### Jira Sync
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/jira-sync/trigger?since=YYYY-MM-DD` | Trigger Jira worklog sync (defaults to 1st of current month) |

## Google Sheets → App Mapping

| Sheet | App Equivalent |
|-------|---------------|
| `clientHours` | `GET /reports/client-hours` → Dashboard page |
| `MonthReport` | `GET /reports/developer-workload` → DeveloperReport page |
| `clientSummary` | Component hours aggregated from child projects |
| `Daily (yyyy-mm-dd)` | Worklogs filtered by date |

## Design Tokens

Dark theme matching `design.html`:

| Token | Value | Usage |
|-------|-------|-------|
| `mgs-bg` | `#0d1117` | Page background |
| `mgs-card` | `#131b2e` | Stat cards |
| `mgs-card-alt` | `#0f1623` | Chart/table sections |
| `mgs-border` | `#1e293b` | Borders |
| `mgs-blue` | `#3b82f6` | Contracted hours |
| `mgs-green` | `#10b981` | Used hours |
| `mgs-purple` | `#8b5cf6` | Remaining hours |
| `mgs-red` | `#ef4444` | Over budget |

Fonts: **DM Sans** (body), **Space Mono** (numbers, labels, badges).

---

## Phase Log

### Phase 1 — Monorepo Structure + Prisma Schema ✅

**Scope**: Foundation scaffolding — monorepo config, database schema, shared types, app skeletons.

**Delivered**:
- Turborepo + npm workspaces monorepo with `apps/` and `packages/` layout
- Prisma schema: `Project` (self-referencing), `Developer`, `Worklog` with composite indexes
- `packages/shared` with DTOs: `ClientHoursSummaryDto`, `MonthReportDto`, `ClientSummaryDto`, `DailySheetDto`
- NestJS API skeleton: 5 modules (projects, developers, worklogs, reports, jira-sync)
- React + Vite + Tailwind v4 frontend with Dashboard, skeleton loaders, Chart.js integration
- Seed script with all 15 clients from the original spreadsheet

**Key decisions**:
- `Decimal` over `Float` for hours/budget (exact arithmetic in SQL aggregations)
- Self-referencing `Project` avoids a separate Client model while preserving client → component hierarchy
- `jiraIssueId @unique` enables Prisma upsert for Jira sync
- `cuid()` IDs — shorter, URL-friendly, roughly time-sortable
- `@@map` snake_case in PostgreSQL, camelCase in TypeScript

### Phase 2 — NestJS Modules, Jira Sync, Upsert Logic, Report Controllers ✅

**Scope**: Full backend implementation — CRUD endpoints, Jira integration, report aggregation.

**Delivered**:
- **Jira Sync Service**: Consumes Jira REST API v3 (`/rest/api/3/search` + `/rest/api/3/issue/{id}/worklog`). Paginates through issues with worklogs, handles issues with >20 worklogs by fetching the full worklog list separately. Uses Basic Auth with credentials from env vars.
- **Upsert Logic**: Each Jira worklog entry is matched by its unique Jira worklog ID (`jiraIssueId` field). `prisma.worklog.upsert()` inserts new entries or updates existing ones. Skips entries where no matching developer (`jiraAccountId`) or project is found in the database.
- **Project Resolution**: Issue key prefix (e.g., `PROJ` from `PROJ-123`) is matched against project names via case-insensitive `contains` search.
- **Full CRUD**: All three entity modules (projects, developers, worklogs) now support `GET /`, `GET /:id`, `POST /`, `PUT /:id` with proper `NotFoundException` handling.
- **Report Endpoints Expanded**:
  - `GET /reports/client-summary` — Component-level hours grouped by parent project (maps to Google Sheets `clientSummary`)
  - `GET /reports/daily?date=YYYY-MM-DD` — Developer × component × hours for a specific day (maps to daily sheets)
- **HTTP Client**: `@nestjs/axios` + `axios` added for Jira API calls.

**Key decisions**:
- Jira worklog ID (not issue ID) stored in `jira_issue_id` — one issue can have many worklog entries, each with a unique ID
- Sync defaults to current month's 1st day; `?since=` param allows historical sync
- Worklogs without a mapped developer or project are silently skipped with debug logging (not errors) — prevents partial sync failures
- Basic Auth over OAuth for Jira — simpler for internal tooling; token stored server-side only (frontend never sees it)

### Phase 3 — React Setup, Tailwind Config, Dashboard Components ✅

**Scope**: Complete frontend — routing, month navigation, DeveloperReport page, pixel-perfect design alignment.

**Delivered**:
- **React Router**: Two-page app with `BrowserRouter` — `/` (Dashboard) and `/developers` (DeveloperReport). AppShell wraps both with persistent nav bar.
- **MonthPicker**: Arrow-based month navigation stored in URL query param (`?month=YYYY-MM`). Forward button disabled for future months. All report queries are reactive to month changes.
- **AppShell + NavTabs**: Top navigation bar with active-state highlighting, MgS branding, and month picker. Consistent layout across pages.
- **DeveloperReport Page**: Full implementation of the `MonthReport` Google Sheet equivalent — stat cards (total/billable/non-billable/active devs), horizontal stacked bar chart, and detail table with billable % progress bars.
- **DeveloperWorkloadChart**: Horizontal stacked bar chart (billable vs non-billable) using react-chartjs-2, sorted by total hours descending. Dynamic height based on developer count.
- **DeveloperTable**: Table with developer rows showing billable, non-billable, total hours, and billable percentage with color-coded progress bars (green ≥75%, amber ≥50%, red <50%).
- **useMonth Hook**: Centralized month state from URL params — provides `month` (YYYY-MM), `label` (display), and `dateStr` (Spanish locale date).
- **Pixel-Perfect Refinements**: `letter-spacing` values matched to design.html CSS (`0.9px` for stat labels, `0.5px` for badges, `1px` for section titles, `0.8px` for table headers, `0.6px` for legend items). Unit `<span>` font-size corrected to `14px`.
- **Production Build**: Vite build passes — 59 modules, 394KB JS (129KB gzipped), 12KB CSS (3.4KB gzipped).

**Key decisions**:
- Month stored in URL query param (`?month=`) rather than React state — enables shareable links and browser back/forward navigation
- Horizontal stacked bars for developer chart (vs vertical grouped bars for client chart) — better readability with long developer names
- NavLink active detection via React Router — no custom state management needed

### Phase 4 — Frontend ↔ Backend Integration, Cold Start UX, Deploy Configs ✅

**Scope**: Wire frontend to live API with production-grade resilience for Koyeb free-tier cold starts. Deploy configurations for Vercel + Koyeb.

**Delivered**:
- **Health Endpoint**: `GET /health` returns `{ status: "ok", timestamp }` — used for connection checks and uptime monitoring. `HealthModule` registered in `AppModule`.
- **Retry Logic with Exponential Backoff**: `fetchApi<T>()` retries up to 3 times on network/timeout errors with 2s → 4s → 8s backoff. 30-second `AbortSignal` timeout per request. Non-network errors (4xx/5xx) are not retried.
- **Cold Start Event System**: Pub/sub pattern via `onColdStartChange()` — components can subscribe to `'waking' | 'ready' | 'failed'` transitions. Global `apiReady` flag prevents redundant "ready" notifications.
- **`useConnectionStatus` Hook**: Reactive hook subscribing to cold-start events. Returns `'connecting' | 'ready' | 'waking' | 'failed'`.
- **Cold Start Banner**: Fixed-position animated banner at top of viewport — amber "Waking up the server..." during cold start with spinner, red error banner on connection failure. Uses `backdrop-blur-sm` for glass effect.
- **`useApi` Refetch**: Hook now exposes `refetch()` callback alongside `data`, `loading`, `error`.
- **Vercel Config**: `vercel.json` with SPA catch-all rewrite (`/(.*) → /index.html`) for React Router client-side routing.
- **Koyeb Dockerfile**: Multi-stage build — installs workspace dependencies, generates Prisma client, builds shared/db/api packages, then copies only production artifacts to slim final image. Exposes port 3001.
- **Procfile**: `web: node dist/main.js` for Koyeb buildpack deployments.
- **Environment Variables**: `.env.example` updated with production-ready comments — `CORS_ORIGIN` for Vercel domain, `VITE_API_URL` for Koyeb API URL.
- **Production Build**: Vite build passes — 61 modules, 397KB JS (130KB gzipped), 15KB CSS (3.8KB gzipped).

**Key decisions**:
- Exponential backoff (2s base) chosen to match Koyeb cold start timing (10-30s typical) — 3 retries covers up to ~14s of downtime before final attempt
- Cold start banner is a global overlay (not per-component) — avoids duplicate notifications and provides consistent UX
- Pub/sub pattern for cold start events (not React context) — allows non-React code (e.g., `fetchApi`) to publish state without coupling to component tree
- Dockerfile uses multi-stage build to minimize image size — final stage only includes compiled JS + node_modules
- SPA rewrite in `vercel.json` instead of hash routing — clean URLs with proper deep-link support

### Phase 5 — Manage Dashboard + Jira Sync Button ✅

**Scope**: Full CRUD management UI for developers and projects, plus a Jira Sync trigger button in the nav bar.

**Delivered**:

**Backend (Phase A)**
- **DELETE endpoints**: `DELETE /developers/:id` and `DELETE /projects/:id` — both verify existence via `findOne()` guard before deleting. FK constraint violations (developer with worklogs, project with worklogs or children) return **409 Conflict** with a descriptive message instead of cascading.
- **PATCH endpoints**: `PATCH /developers/:id` and `PATCH /projects/:id` — alias for existing `PUT` update logic. All fields optional, follows existing inline-type pattern (no `class-validator` DTOs).

**Frontend (Phase B)**
- **`mutateApi<T>(path, method, body?)`**: New helper in `services/api.ts` for POST/PATCH/PUT/DELETE mutations. Parses NestJS error message from JSON response body for user-friendly error display.
- **`Modal`** (`components/ui/Modal.tsx`): Reusable dark-themed overlay. Closes on backdrop click or Escape key. Uses existing `mgs-card` / `mgs-border` tokens.
- **`ToastContainer` + `showToast()`** (`components/ui/Toast.tsx`): Global auto-dismiss notifications (3.5s). Callback-based (`showToast()` can be called from anywhere without React context). Green success / red error variants with slide-in animation.
- **`DeveloperPanel`** (`components/manage/DeveloperPanel.tsx`): Table listing all developers (name, email, Jira ID, Slack ID). Add, edit, and delete per row. Delete requires confirmation modal before API call.
- **`ProjectPanel`** (`components/manage/ProjectPanel.tsx`): Table listing all projects (name, monthly budget). Same CRUD pattern as DeveloperPanel.
- **`DeveloperForm`** (`components/manage/DeveloperForm.tsx`): Create/edit form with fields name, email, jiraAccountId, slackId. Dual-use (pre-populated for edit). Loading state on submit, inline error display.
- **`ProjectForm`** (`components/manage/ProjectForm.tsx`): Create/edit form with fields name, monthlyBudget. Same pattern.
- **`Manage` page** (`pages/Manage.tsx`): Two-panel layout (Developers + Projects). Uses `useApi` for data fetching with `TableSkeleton` while loading.
- **Routing**: `/manage` route added to `App.tsx`. "Manage" NavTab added to nav bar. `MonthPicker` is hidden on the `/manage` route (not relevant for CRUD).
- **`ToastContainer`** mounted in `App.tsx` at root level — single instance for the whole app.

**Frontend (Phase C)**
- **`SyncButton`** in `AppShell.tsx` nav bar: Calls `POST /jira-sync/trigger`. Shows animated spinner while request is in flight. Button is disabled during sync to prevent double-triggers. Shows success or error toast on completion. Uses same SVG spinner pattern as `ColdStartBanner`.

**Production Build**: Vite build passes — 68 modules, 412KB JS (133KB gzipped), 21KB CSS (4.8KB gzipped).

**Key decisions**:
- DELETE returns 409 Conflict on FK constraint (not cascade) — safer for production data; user sees a clear error message
- `showToast()` is a plain function (not a hook or context) — can be called from async event handlers and panel components without prop drilling
- `mutateApi` does not retry like `fetchApi` — mutations are not idempotent, retrying would risk duplicate creates
- `Modal` closes on backdrop click using `e.target === overlayRef.current` guard — prevents close when clicking inside the dialog content
- `MonthPicker` hidden on `/manage` — determined via `useLocation()` in `AppShell`, no extra state needed

### Phase 6 — Dark/Light Theme Toggle ✅

**Scope**: Global theme system with dark (default) and light modes, persisted to localStorage.

**Delivered**:
- **`ThemeProvider` + `useTheme` hook** (`hooks/useTheme.tsx`): React Context holding `{ theme, toggleTheme }`. Reads `localStorage('app-theme')` on mount (defaults to `'dark'`). On toggle, updates state, writes localStorage, and sets `data-theme` attribute on `<html>`.
- **CSS variable overrides** (`index.css`): `[data-theme="light"]` selector overrides all `--color-mgs-*` custom properties. Since Tailwind v4 compiles `@theme` tokens into CSS custom properties and all `bg-mgs-*` / `text-mgs-*` utilities reference them, **every existing component automatically picks up light colors — zero per-component changes**.
- **Light theme tokens**:

| Token | Dark | Light |
|-------|------|-------|
| `mgs-bg` | `#0d1117` | `#f0f2f5` |
| `mgs-card` | `#131b2e` | `#ffffff` |
| `mgs-card-alt` | `#0f1623` | `#f7f9fc` |
| `mgs-border` | `#1e293b` | `#e2e8f0` |
| `mgs-border-dark` | `#0f172a` | `#cbd5e1` |
| `mgs-text` | `#e2e8f0` | `#1e293b` |
| `mgs-text-muted` | `#94a3b8` | `#475569` |
| `mgs-text-dim` | `#64748b` | `#64748b` |
| `mgs-text-faint` | `#475569` | `#94a3b8` |

- **Smooth transitions**: Global `transition: background-color, border-color, color 0.2s ease` via `*` selector — eliminates flash on theme swap.
- **`ThemeToggle` button** in `AppShell.tsx` nav bar: "☀️ Light Mode" when dark is active, "🌙 Dark Mode" when light is active. Styled identically to existing nav buttons (`font-mono`, `border-mgs-border`, `bg-mgs-card`).
- **Hardcoded colors removed**: Replaced `text-[#f8fafc]` in `Header.tsx`, `Modal.tsx`, and `AppShell.tsx` with `text-mgs-text` — all colors now theme-aware.
- **Accent colors unchanged**: `mgs-blue`, `mgs-green`, `mgs-purple`, `mgs-red`, `mgs-amber` pass WCAG AA contrast on both backgrounds — no overrides needed.
- **Production Build**: Vite build passes — 69 modules, 412KB JS (133KB gzipped), 21KB CSS (4.9KB gzipped).

**Key decisions**:
- CSS variable override approach (not class toggling) — one `[data-theme="light"]` block in CSS themes the entire app with zero component changes. Far more maintainable than per-component conditional classes.
- `data-theme` attribute on `<html>` (not body or a wrapper div) — ensures any CSS anywhere in the tree can use the selector, including third-party styles.
- `localStorage` key `'app-theme'` — explicit user preference overrides OS `prefers-color-scheme` (user control > OS default).
- Accent colors stay identical in both themes — blue/green/red/purple already meet WCAG AA on both `#0d1117` and `#f0f2f5` backgrounds.

### Phase 7 — Atomic Design Refactor ✅

**Scope**: Restructure the entire `apps/web/src/components/` tree to enforce Atomic Design composition hierarchy with zero visual or functional changes.

#### Phase 7A — File Reorganization

All 26 component files moved from flat `ui/`, `charts/`, `manage/`, `layout/` folders into proper Atomic Design tiers:

| Tier | Path | Rule |
|------|------|------|
| Atoms | `components/atoms/` | HTML + Tailwind only — no custom component imports |
| Molecules | `components/molecules/` | Import atoms only |
| Organisms | `components/organisms/` | Import molecules and/or atoms |
| Templates | `components/templates/` | Import organisms, molecules, atoms |
| Pages | `components/pages/` | Import templates, organisms, molecules, atoms |

Import direction is strictly one-way: **Atoms ← Molecules ← Organisms ← Templates ← Pages**. No tier may import from a tier above it.

#### Phase 7B — Composition Hierarchy Enforcement

Extracted 8 new atom primitives shared across 3+ components, and 1 new molecule:

**New Atoms**

| Atom | Props | Used by |
|------|-------|---------|
| `Button` | `variant?: 'primary' \| 'secondary' \| 'danger' \| 'link-blue' \| 'link-red'`, `className?` | Modal, MonthPicker, all panels, AppShell, all pages |
| `Input` | `className?` (overrides default style) | DeveloperForm, ProjectForm, ComponentPanel |
| `Label` | `required?: boolean`, `className?` | DeveloperForm, ProjectForm, ComponentPanel, FilterForm |
| `Badge` | `className?`, `style?` | MonthPicker, ComponentPanel, TrashPanel, CustomReports |
| `Spinner` | `className?` | ColdStartBanner, AppShell |
| `TableHeader` | `className?` | ClientTable, DeveloperTable, DeveloperPanel, ProjectPanel, ComponentPanel, TrashPanel |
| `LegendItem` | `color: string`, `label: string`, `className?` | ClientHoursChart, DeveloperWorkloadChart, ReportChart |
| `Alert` | `variant: 'inline' \| 'section' \| 'page'` | All forms, all panels, all pages |

**New Molecule**

| Molecule | Atoms used | Used by |
|----------|------------|---------|
| `ConfirmDialog` | `Modal` + `Button` | DeveloperPanel, ProjectPanel, ComponentPanel |

**Button atom variants**

| Variant | Visual | Use case |
|---------|--------|---------|
| `primary` | Blue filled, `hover:opacity-90` | Submit, Add actions |
| `secondary` | Border only | Cancel, neutral actions |
| `danger` | Red filled | Destructive confirm |
| `link-blue` | Text-only blue | Inline Edit links |
| `link-red` | Text-only red | Inline Delete links |

Both `variant` and `className` can be combined — variant sets the base style, `className` appends additional classes (e.g. `variant="link-blue" className="mr-2"`).

**Alert atom variants**

| Variant | Visual | Use case |
|---------|--------|---------|
| `inline` | Small red border box (`text-xs`) | Form validation errors |
| `section` | Padded red box (`text-xs`, `py-6`) | Panel/widget error state |
| `page` | Full-width red box (`text-sm`, `p-6`) | Page-level data load failure |

**Key decisions**:
- `Button` variant does not prevent `className` — both are combined via `filter(Boolean).join(' ')`. This handles the common case of needing a variant style plus a layout modifier (e.g. `mr-2`).
- `TableHeader` and `Badge` are intentionally thin wrappers — they enforce correct semantic elements (`<th>`, `<span>`) while allowing full style customization via `className`.
- Local `Th` helper functions inside organisms are kept but rewritten to wrap `<TableHeader>` — this avoids changing every call site while still routing through the atom.
- `ConfirmDialog` replaces the inline `<Modal>` + two `<button>` block that was copy-pasted in DeveloperPanel, ProjectPanel, and ComponentPanel.
- Zero visual changes — all existing `className` strings were preserved exactly when converting raw elements to atoms.
