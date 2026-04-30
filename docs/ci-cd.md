# CI/CD — GitHub Actions Workflows

Two workflows live in `.github/workflows/`:

| File         | Trigger                      | Purpose                 |
| ------------ | ---------------------------- | ----------------------- |
| `ci.yml`     | Push + PR → `develop`/`main` | Lint, build, test gate  |
| `deploy.yml` | Push → `develop`/`main`      | Test → migrate → deploy |

---

## `ci.yml` — Continuous Integration

Runs on every push and pull request targeting `develop` or `main` (path-filtered to avoid triggering on pure doc changes). Also available via `workflow_dispatch`.

```
checkout → Node 20 + npm cache → npm ci
  → prisma generate
  → format:check
  → lint
  → build
  → npm test
```

**Path filter** — only runs when these paths change:

```
apps/**
packages/**
api/**
eslint.config.mjs
package.json
package-lock.json
turbo.json
.github/workflows/ci.yml
```

---

## `deploy.yml` — Deploy Pipeline

Runs on push to `develop` or `main` (same path filter + `vercel.json`). Four jobs:

```
test ──────────────────────────────────────────────── always
detect-changes ────────────────────────────────────── always
migrate ←── [test + detect-changes] ──────────────── only if DB files changed
deploy  ←── [test + migrate] ─────────────────────── if test passed AND (migrate passed OR skipped)
```

### Job: `test`

Identical gate to `ci.yml` — install, generate, format-check, lint, build, test. Must pass before anything is deployed.

### Job: `detect-changes`

Uses `dorny/paths-filter@v3` to detect whether `packages/db/prisma/schema.prisma` or any file under `packages/db/prisma/migrations/**` changed. Outputs `db: true/false`.

### Job: `migrate`

Runs only when `detect-changes.outputs.db == 'true'`. Executes:

```bash
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

Uses the `DATABASE_URL` secret — must be the **direct (non-pooled)** Neon connection string. `prisma migrate deploy` issues DDL statements that pgbouncer blocks.

### Job: `deploy`

Condition:

```yaml
if: always() && needs.test.result == 'success' && (needs.migrate.result == 'success' || needs.migrate.result == 'skipped')
```

Steps:

```bash
vercel pull --yes --environment=production|preview --token=$VERCEL_TOKEN
vercel build [--prod] --token=$VERCEL_TOKEN
vercel deploy --prebuilt [--prod] --token=$VERCEL_TOKEN
```

- **`main` branch** → `--prod` flag → production deployment
- **`develop` branch** → no flag → Vercel preview deployment (unique staging URL)

---

## Required GitHub Secrets

Set these under **Repo → Settings → Secrets and variables → Actions**:

| Secret              | Where to find it                                                     |
| ------------------- | -------------------------------------------------------------------- |
| `VERCEL_ORG_ID`     | Vercel → Settings → General → Team ID                                |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General → Project ID                   |
| `VERCEL_TOKEN`      | Vercel → Account → Settings → Tokens                                 |
| `DATABASE_URL`      | Neon → Dashboard → Connection Details → **direct** connection string |

> `DATABASE_URL` here is the non-pooled Neon URL (same as local `DIRECT_DATABASE_URL`). Do not use the pgbouncer URL — migrations will fail.

---

## Branch Strategy

| Branch           | CI                  | Deploy target     |
| ---------------- | ------------------- | ----------------- |
| `develop`        | ✅ on push + PR     | Vercel preview    |
| `main`           | ✅ on push + PR     | Vercel production |
| feature branches | ✅ on PR to develop | —                 |

---

## Adding a New Secret or Env Var

1. Add the secret to GitHub → Repo Settings → Secrets.
2. Reference it in the workflow step that needs it: `env: MY_VAR: ${{ secrets.MY_VAR }}`.
3. For Vercel runtime env vars, also add them to the Vercel project dashboard (Settings → Environment Variables) so `vercel pull` picks them up during the build step.
