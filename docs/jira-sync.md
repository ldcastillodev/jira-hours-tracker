# Jira Sync — Batch Upsert Optimization

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

### Return value

The response now distinguishes inserts from updates:

```json
{
  "status": "completed",
  "since": "2026-04-01",
  "totalProcessed": 487,
  "inserted": 312,
  "updated": 175,
  "skippedCount": 13
}
```

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/modules/jira-sync/jira-sync.service.ts` | Replaced `upsertWorklog()` with `batchUpsertChunk()`; rewrote `syncWorklogs()` body |

No schema changes. No new dependencies. No changes to `jira-sync.controller.ts` or `jira-sync.module.ts`.
