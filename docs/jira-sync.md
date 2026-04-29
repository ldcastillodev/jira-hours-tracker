# Jira Sync — Change Detection, Orphan Soft-Delete & Batch Optimization

## Features

1. **Month selector** — trigger a sync for any past month of the current year from the nav bar
2. **Change detection** — skip unchanged worklogs; only write records whose `hours`, `date`, or `ticketKey` changed
3. **Orphan soft-delete** — worklogs that exist in DB but were deleted from Jira are soft-deleted (`deletedAt`) within the synced date range
4. **Batch queries** — one date-range preload replaces per-chunk existence checks
5. **UI auto-refresh** — all open dashboards refresh automatically after a sync completes

## Problem

The original `syncWorklogs()` implementation issued **3 database queries per worklog**:

1. `component.findFirst()` — look up the component by name
2. `developer.findUnique()` — look up the developer by email
3. `worklog.upsert()` — insert or update the worklog

For a sync covering 500 worklogs this meant ~1,500 sequential queries, each waiting on a round-trip to the database before the next one started.

## Architecture

```
syncWorklogs(startDate, endDate)
├── Step 1 — Load active components + all developers (2 queries, once)
├── Step 2 — Paginate Jira search API
├── Step 3 — Flatten worklogs from all issues (in memory)
├── Step 4 — Validate + transform using Maps/Sets (0 queries)
├── Step 5 — Load all existing DB worklogs for date range (1 query)
│           └─ dbMap: Map<jiraWorklogId, {hours, date, ticketKey}>
│           └─ dbIdSet: Set<jiraWorklogId>
├── Step 6 — Three-way in-memory split (0 queries)
│           ├─ toCreate     : new Jira worklogs not in DB
│           ├─ toUpdate     : in DB with changed hours/date/ticketKey
│           ├─ toSoftDelete : in DB but absent from Jira response (orphans)
│           └─ unchanged    : identical — skipped entirely
└── Step 7 — Batch writes
            ├─ createMany in chunks of 200
            ├─ individual updates in transactions of 200
            └─ updateMany({ deletedAt: now }) for all orphans (single statement)
```

### Query count comparison

| Scenario | Original (pre-batch) | After batch (Phase 9) | After change detection (Phase 12) |
|----------|---------------------|----------------------|-----------------------------------|
| Setup | 2 | 2 | 2 |
| DB preload | 0 | 0 | 1 |
| Per-chunk existence check | 0 | N/200 | 0 |
| Writes | ~N | changed/200 txns | changed/200 txns |
| Skip unchanged | No | No | Yes — 0 writes |
| Orphan detection | No | No | Yes — 1 `updateMany` |
| **500 worklogs, 80% unchanged** | ~1,500 queries | ~12 queries | ~5 queries |

### Lookup tables (Step 1)

```typescript
const [dbComponents, dbDevelopers] = await Promise.all([
  this.prisma.component.findMany({ where: { deletedAt: null } }),
  this.prisma.developer.findMany(),
]);

const componentMap = new Map(dbComponents.map((c) => [c.name, c.id]));
const developerEmails = new Set(dbDevelopers.map((d) => d.email));
```

Both tables are loaded once and kept in memory. Component lookup is O(1) via `Map`, developer check is O(1) via `Set`.

### In-memory validation (Step 4)

Each worklog is validated against the in-memory structures before being added to the `records` array. Worklogs skipped here never touch the database:

- No matching active component → skip
- No matching developer email → skip

### DB preload (Step 5)

```typescript
const dbWorklogs = await this.prisma.worklog.findMany({
  where: { date: { gte: new Date(startDate), lte: new Date(endDate) }, deletedAt: null },
  select: { jiraWorklogId: true, hours: true, date: true, ticketKey: true },
});
const dbMap = new Map(dbWorklogs.map((w) => [w.jiraWorklogId, w]));
const dbIdSet = new Set(dbWorklogs.map((w) => w.jiraWorklogId));
```

One query loads all existing records for the date range. All subsequent comparisons are O(1) map lookups.

### Change detection (Step 6)

Only **mutable fields** are compared — `hours`, `date`, and `ticketKey`. `assigned` and `componentId` are considered immutable after creation.

```typescript
const hoursChanged = Math.abs(Number(existing.hours) - record.hours) > 0.0001;
const dateChanged  = (existing.date as Date).getTime() !== record.date.getTime();
const ticketChanged = existing.ticketKey !== record.ticketKey;
if (hoursChanged || dateChanged || ticketChanged) toUpdate.push(record);
// else: skip — no write
```

### Orphan detection + soft-delete (Step 6 → Step 7)

Any `jiraWorklogId` that exists in the DB for the date range but is absent from the Jira response is considered deleted in Jira:

```typescript
const toSoftDelete = [...dbIdSet].filter((id) => !jiraIdSet.has(id));

// One bulk statement:
await this.prisma.worklog.updateMany({
  where: { jiraWorklogId: { in: toSoftDelete } },
  data: { deletedAt: new Date() },
});
```

Soft-deleted worklogs are excluded from all reports via `deletedAt: null` filters. They do not appear in the Inactive panel.

### Error isolation

Each write chunk is wrapped in a `try/catch`. If one chunk fails, the error is logged and processing continues with the next chunk.

### Batch writes (Step 7)

- **Creates**: `createMany` in chunks of 200 — one statement per chunk
- **Updates**: individual `update` calls inside a `$transaction` per chunk of 200 — Prisma has no bulk `updateMany` with per-row data
- **Soft-deletes**: one `updateMany` for all orphans regardless of count

```json
{
  "success": true,
  "message": "Synced 57 changes from February 2026 · 3 removed",
  "month": 2,
  "year": 2026,
  "worklogsSynced": 57,
  "worklogsCreated": 45,
  "worklogsUpdated": 12,
  "worklogsDeleted": 3,
  "worklogsUnchanged": 430,
  "skipped": 8
}
```

The `· N removed` suffix only appears if `worklogsDeleted > 0`.

## Month Selector (Frontend)

The "Sync Jira" button in the nav bar opens a dropdown listing all 12 months of the current year:

- **Current month** is marked with a `•` prefix
- **Future months** are dimmed and non-clickable
- Selecting a month closes the dropdown and immediately starts the sync
- The button shows a spinner and `Syncing...` while the request is in flight
- On completion the toast message comes directly from the API response (e.g. `"Synced 45 worklogs from February 2026"`)

Validation is enforced at both layers:
- **Frontend**: future month buttons have `pointer-events-none`
- **Backend**: `BadRequestException` if `month > currentMonth`

## Endpoint

```
POST /jira-sync/trigger?month=2
```

- `month`: 1–12 (1 = January). Omit to default to the current month.
- `year` is always the server's current year — no parameter accepted.
- Validation throws `400 Bad Request` for invalid or future months.

Date range for the selected month:
```
startDate = YYYY-MM-01
endDate   = YYYY-MM-{last day of month}
```

JQL clause: `worklogDate >= "${startDate}" AND worklogDate <= "${endDate}"`

## UI Auto-Refresh

After a sync completes, all open dashboard pages automatically re-fetch their data without a page reload.

**Implementation** — module-level event bus in `apps/web/src/hooks/useApi.ts`:

```ts
export function emitDataRefresh() {
  window.dispatchEvent(new CustomEvent('mgs:data-refresh'));
}

export function useDataRefresh(callback: () => void) {
  // registers a listener; uses a ref so it never re-registers on re-renders
}
```

| Location | Behavior |
|----------|----------|
| `AppShell` (`SyncButton`) | calls `emitDataRefresh()` after a successful sync |
| `Dashboard` | calls `useDataRefresh(refetch)` — chart + stat cards reload |
| `DeveloperReport` | calls `useDataRefresh(refetch)` — chart + table reload |
| `CustomReports` | shows an amber "Jira data was synced — re-generate for updated results" banner (dismissible); does not auto-refresh to avoid resetting active filter state |

## Files Changed

| File | Change |
|------|--------|
| `packages/db/prisma/schema.prisma` | Added `deletedAt DateTime?` + `@@index([date])` to `Worklog` |
| `packages/db/prisma/migrations/20260429130226_add_worklog_soft_delete/` | New migration |
| `apps/api/src/modules/jira-sync/jira-sync.service.ts` | Replaced `batchUpsertChunk()` with Steps 5–7 (preload, 3-way split, separate create/update/soft-delete writes) |
| `apps/api/src/modules/jira-sync/jira-sync.controller.ts` | Added `worklogsDeleted`, `worklogsUnchanged` to response; updated message format |
| `apps/api/src/modules/reports/reports.service.ts` | Added `deletedAt: null` to all 4 worklog `findMany` calls |
| `apps/api/src/modules/worklogs/worklogs.service.ts` | Added `deletedAt: null` to `findAll` query |
| `apps/web/src/hooks/useApi.ts` | Added `emitDataRefresh()` and `useDataRefresh()` exports |
| `apps/web/src/components/templates/AppShell/AppShell.tsx` | `SyncButton` replaced with month-selector dropdown; calls `emitDataRefresh()` after sync |
| `apps/web/src/components/pages/Dashboard/Dashboard.tsx` | Added `useDataRefresh(refetch)` |
| `apps/web/src/components/pages/DeveloperReport/DeveloperReport.tsx` | Added `useDataRefresh(refetch)` |
| `apps/web/src/components/pages/CustomReports/CustomReports.tsx` | Added stale hint banner + `useDataRefresh` |

No new npm dependencies.
