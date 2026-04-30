# Project Hours Dashboard — Documentación

## Overview

The Project Hours Dashboard (`/`) shows monthly budget consumption across all active projects. It includes stat cards, bar charts, and a detail table. Data comes from `GET /reports/client-hours?month=YYYY-MM`.

---

## Stat Cards

Five cards in a responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-5`):

| Card                 | Color     | Value                                                   | Sub-text                                                 |
| -------------------- | --------- | ------------------------------------------------------- | -------------------------------------------------------- |
| Total Contracted     | `#3b82f6` | Sum of `monthlyBudget` across billable projects         | "all projects"                                           |
| Hours Used           | `#10b981` | Total billable hours worked                             | `X% of total` (guarded against ÷0)                       |
| Remaining Hours      | `#8b5cf6` | `totalContracted - totalUsed` (negative if over budget) | "projects within budget"                                 |
| Near Limit           | `#f59e0b` | Count of billable projects at 75–99% consumption        | All project names + their % (e.g. `Alpha 82%, Beta 91%`) |
| Over-Budget Projects | `#ef4444` | Count of billable projects over 100%                    | All project names + their % (e.g. `Alpha 112%`)          |

### Near Limit logic

- Filter: `isBillable && percentUsed >= 75 && percentUsed < 100`
- Projects already over 100% are **excluded** — they appear in Over-Budget only
- Sub-text lists every matching project with its rounded percentage
- Shows amber WARNING badge (`#f59e0b`) when count > 0
- Falls back to `"all projects within budget"` when count = 0

### Over-Budget logic

- Derived from `client.remaining < 0` (billable projects only)
- Sub-text lists every matching project with its rounded percentage
- Shows red REVIEW badge when count > 0
- Falls back to `"all projects within budget"` when count = 0

### Alert badge colors

`StatCard` accepts an optional `alertColor` prop. When provided, the badge border, background, and text use that color inline. When omitted, the badge defaults to the red theme classes.

---

## Charts

Two bar charts stacked vertically, each in a full-width card (`rounded-xl border`):

### Billable Projects chart

- Height: `300px`, `maintainAspectRatio: false`
- 3 datasets: **Contracted** (blue `#3b82f6`), **Used** (green `#10b981`), **Remaining / Overage** (purple `#8b5cf6` or red `#ef4444` if negative)
- `barThickness: 32` — fixed bar width regardless of project count or container width

### Non-Billable Projects chart

- Height: `260px`, `maintainAspectRatio: false`
- 1 dataset: **Hours Used** (purple `#8b5cf6`)
- `barThickness: 32`
- Only rendered if non-billable projects with hours exist

Both charts use `responsive: true` so they fill available container width.

---

## Table

`ClientTable` renders below the charts, split into two sections:

| Section               | Columns                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------ |
| Billable Projects     | Project · Contracted · Used · Remaining · % Used (with OVER BUDGET badge and progress bar) |
| Non-Billable Projects | Project · Hours Used                                                                       |

Each section only renders if it has data.

---

## Billable vs Non-Billable split

A project is non-billable if its component has `isBillable = false`. Non-billable projects:

- Are **excluded** from Hours Used total
- Are **excluded** from Total Contracted, Remaining Hours, Near Limit, Over-Budget counts
- Appear in the Non-Billable chart and Non-Billable table section only

---

## Files

| File                                                  | Role                                                                              |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| `apps/web/src/pages/Dashboard.tsx`                    | Page: derives nearBudget/overBudget lists, renders all cards                      |
| `apps/web/src/components/ui/StatCard.tsx`             | Stat card component — accepts optional `alertColor` prop                          |
| `apps/web/src/components/charts/ClientHoursChart.tsx` | Billable + non-billable bar charts                                                |
| `apps/web/src/components/ui/ClientTable.tsx`          | Detail table split by billability                                                 |
| `apps/api/src/modules/reports/reports.service.ts`     | `getClientHours()` — returns `ClientHoursSummaryDto` with `isBillable` per client |
| `packages/shared/src/dto/client-hours.dto.ts`         | `ClientHoursDto` — includes `isBillable: boolean`                                 |
