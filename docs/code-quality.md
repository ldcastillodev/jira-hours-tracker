# Code Quality — ESLint, Prettier & Husky

Enforced via three tools that work together:

| Tool                    | Role                                    |
| ----------------------- | --------------------------------------- |
| **ESLint**              | Catch bugs and bad patterns             |
| **Prettier**            | Enforce consistent formatting           |
| **Husky + lint-staged** | Run checks automatically on commit/push |

---

## ESLint

Single flat config at repo root — `eslint.config.mjs`. Covers the entire monorepo via file globs. Uses ESLint v9 flat config format.

### Rule blocks

**All files (`**/\*.{ts,tsx}`)\*\*

| Rule                                               | Level | Notes                                                 |
| -------------------------------------------------- | ----- | ----------------------------------------------------- |
| `@typescript-eslint/no-explicit-any`               | warn  | Prefer typed alternatives                             |
| `no-unused-vars`                                   | warn  | `argsIgnorePattern: ^_` — prefix unused args with `_` |
| `no-console`                                       | warn  | Remove debug logs before merging                      |
| `@typescript-eslint/explicit-function-return-type` | off   | Too noisy for React components                        |

**Web app only (`apps/web/src/**/\*.{ts,tsx}`)\*\*

| Rule                          | Level | Notes                                   |
| ----------------------------- | ----- | --------------------------------------- |
| `react-hooks/rules-of-hooks`  | error | Hooks must follow the rules             |
| `react-hooks/exhaustive-deps` | warn  | Missing effect dependencies             |
| `react/react-in-jsx-scope`    | off   | Not needed with React 17+ JSX transform |
| `react/prop-types`            | off   | TypeScript covers this                  |

**API only (`apps/api/src/**/_.ts`, `test/\*\*/_.ts`)\*\*

| Rule                    | Level | Notes                                                  |
| ----------------------- | ----- | ------------------------------------------------------ |
| `no-constant-condition` | off   | Allows `do { } while (true)` in `jira-sync.service.ts` |

### Running lint

```bash
# Check only (CI / pre-push)
npm run lint

# Auto-fix (local dev)
npm run lint:fix
```

---

## Prettier

Config at `.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

`.prettierignore` excludes `dist/`, `.turbo/`, `packages/db/prisma/migrations/`, and lock files.

```bash
# Format all files
npm run format

# Check without writing (CI / pre-push)
npm run format:check
```

---

## Husky Hooks

### `pre-commit` — fast, staged-only

Runs `lint-staged` which processes only staged files:

| Files         | Actions                             |
| ------------- | ----------------------------------- |
| `*.{ts,tsx}`  | `prettier --write` → `eslint --fix` |
| `*.{json,md}` | `prettier --write`                  |

Staged changes are re-added after fixes so the commit includes the formatted result.

### `pre-push` — full quality gate

Runs sequentially against the entire codebase:

```
format:check → lint → npm test
```

If any step fails the push is aborted. Fix the issues and retry.

---

## Adding New Rules

Edit `eslint.config.mjs` at repo root. The file is structured as an array of config objects — add to the relevant block (global, web-only, or api-only) or append a new object for a more specific glob.

Do not create per-app `eslint.config.*` files — they break lint-staged which runs from the repo root.

---

## Baseline State

As of Phase 16:

- **0 errors** across the entire codebase
- **37 warnings** — all `no-console` or `no-explicit-any`, none blocking
- All 77 tests passing
- `format:check` passes on all files
