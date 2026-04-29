# Jira Sync — Batch Upsert Optimization & Month Selector

## Features

1. **Month selector** — trigger a sync for any past month of the current year from the nav bar
2. **Batch upsert** — replace per-worklog DB queries with bulk operations
3. **UI auto-refresh** — all open dashboards refresh automatically after a sync completes

## Problem

The original `syncWorklogs()` implementation issued **3 database queries per worklog**:

1. `component.findFirst()` — look up the component by name
2. `developer.findUnique()` — look up the developer by email
3. `worklog.upsert()` — insert or update the worklog

For a sync covering 500 worklogs this meant ~1,500 sequential queries, each waiting on a round-trip to the database before the next one started.

## Solution

Collapse the per-row queries into a fixed upfront cost + small per-chunk cost, regardless of worklog count.

### Architecture

```
syncWorklogs()
├── Step 1 — Load all active components + all developers (2 queries, once)
├── Step 2 — Paginate Jira search API (unchanged)
├── Step 3 — Flatten worklogs from all issues (in memory)
├── Step 4 — Validate + transform using in-memory Maps/Sets (0 queries)
└── Step 5 — Batch upsert in chunks of 200
             └── batchUpsertChunk()
                 ├── findMany({ jiraWorklogId: { in: ids } })  — 1 query
                 └── $transaction(createMany + individual updates) — 1 transaction
```

### Query count comparison

| | Before | After |
|---|---|---|
| DB queries for N worklogs | ~3N | 2 + (⌈N/200⌉ × 2) |
| 500 worklogs | ~1,500 queries | ~12 queries |
| 2,000 worklogs | ~6,000 queries | ~42 queries |

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

### Batch upsert (Step 5)

Chunks of up to 200 records are sent to `batchUpsertChunk()`:

```typescript
// 1. Find which IDs already exist
const existing = await this.prisma.worklog.findMany({
  where: { jiraWorklogId: { in: ids } },
  select: { jiraWorklogId: true },
});

// 2. Split into creates vs updates
const toCreate = records.filter((r) => !existingIdSet.has(r.jiraWorklogId));
const toUpdate = records.filter((r) => existingIdSet.has(r.jiraWorklogId));

// 3. Apply in a single transaction
await this.prisma.$transaction(async (tx) => {
  if (toCreate.length > 0) await tx.worklog.createMany({ data: toCreate });
  for (const r of toUpdate) await tx.worklog.update({ ... });
});
```

`createMany` handles all new records in one statement. Existing records are updated individually within the same transaction (Prisma does not support `updateMany` with per-row data without raw SQL).

### Error isolation

Each chunk is wrapped in a `try/catch`. If one chunk fails (e.g. a transient DB error), the error is logged with the chunk index and first/last jiraWorklogId, and processing continues with the next chunk:

```
[JiraSyncService] Chunk 3/10 failed (IDs abc...xyz): Connection timeout
```

This prevents a single bad record or network blip from aborting the entire sync.

```json
{
  "success": true,
  "message": "Synced 487 worklogs from February 2026",
  "month": 2,
  "year": 2026,
  "worklogsSynced": 487,
  "worklogsCreated": 312,
  "worklogsUpdated": 175,
  "skipped": 13
}
```

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
| `apps/api/src/modules/jira-sync/jira-sync.service.ts` | Replaced `upsertWorklog()` with `batchUpsertChunk()`; rewrote `syncWorklogs(startDate, endDate)` |
| `apps/api/src/modules/jira-sync/jira-sync.controller.ts` | Accepts `?month=1-12`; validates and computes date range; reshapes response |
| `apps/web/src/hooks/useApi.ts` | Added `emitDataRefresh()` and `useDataRefresh()` exports |
| `apps/web/src/components/templates/AppShell/AppShell.tsx` | `SyncButton` replaced with month-selector dropdown; calls `emitDataRefresh()` after sync |
| `apps/web/src/components/pages/Dashboard/Dashboard.tsx` | Added `useDataRefresh(refetch)` |
| `apps/web/src/components/pages/DeveloperReport/DeveloperReport.tsx` | Added `useDataRefresh(refetch)` |
| `apps/web/src/components/pages/CustomReports/CustomReports.tsx` | Added stale hint banner + `useDataRefresh` |

No schema changes. No new npm dependencies.
