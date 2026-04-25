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
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── projects/       # Project CRUD + budget
│   │       │   ├── developers/     # Developer management
│   │       │   ├── worklogs/       # Worklog CRUD
│   │       │   ├── reports/        # Aggregated report endpoints
│   │       │   └── jira-sync/      # Jira API proxy + upsert
│   │       └── prisma/             # PrismaService (injectable)
│   │
│   └── web/                        # React frontend
│       └── src/
│           ├── components/
│           │   ├── ui/             # StatCard, ClientTable, Skeleton
│           │   ├── charts/         # ClientHoursChart (react-chartjs-2)
│           │   └── layout/         # Header
│           ├── pages/              # Dashboard, DeveloperReport
│           ├── hooks/              # useApi
│           └── services/           # API client
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
├── package.json
└── .env.example
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and Jira credentials

# 3. Generate Prisma client
npm run db:generate

# 4. Push schema to database (or run migrations)
npm run db:push

# 5. Seed sample data
npm run db:seed

# 6. Start development
npm run dev
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

### Developers
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/developers` | List all developers |
| `GET` | `/developers/:id` | Get single developer |
| `POST` | `/developers` | Create developer (`name`, `email`, `jiraAccountId?`, `slackId?`) |
| `PUT` | `/developers/:id` | Update developer fields |

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
