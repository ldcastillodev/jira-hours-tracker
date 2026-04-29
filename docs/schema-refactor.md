# Schema Refactor — Documentación

## Qué se cambió

### Objetivo

Reemplazar el schema original (Project con auto-referencia `parentId`, Developer con `worklogs` directo, Worklog con `projectId + developerId + isBillable`) por un modelo más limpio:

- **Project** → tiene **Components**
- **Component** → define billability, pertenece a un Project, tiene Worklogs
- **Worklog** → referencia `componentId` + `jiraAccountId` (string, no FK)
- Todos los IDs pasan de `String cuid()` a `Int autoincrement()`
- Se elimina la jerarquía `parentId/parent/children` de Project

---

## Comandos ejecutados

### 1. Reset de la base de datos y aplicación de la migración

```bash
# Resetear la DB (borra todos los datos y migraciones previas)
npx prisma migrate reset --force --schema=packages/db/prisma/schema.prisma

# Aplicar el nuevo schema como migración
npx prisma migrate dev --name "refactor_schema" --schema=packages/db/prisma/schema.prisma
```

La migración generada queda en:

```
packages/db/prisma/migrations/20260425080955_refactor_schema/migration.sql
```

### 2. Seed de datos

```bash
cd packages/db
npx ts-node prisma/seed.ts
```

Resultado: `{ projects: 3, components: 6, developers: 4, worklogs: 258 }`

---

## Archivos modificados

| Archivo                                                    | Qué cambió                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `packages/db/prisma/schema.prisma`                         | Schema completo reemplazado                                                                                |
| `packages/db/prisma/seed.ts`                               | Nuevo seed con Projects, Components, Developers con `jiraAccountId` requerido                              |
| `packages/shared/src/dto/client-hours.dto.ts`              | `projectId: string` → `number`                                                                             |
| `packages/shared/src/dto/month-report.dto.ts`              | `developerId: string` → `number`                                                                           |
| `packages/shared/src/dto/client-summary.dto.ts`            | `ComponentSummaryDto` reescrito: `componentId`, `componentName`, `projectName`, `isBillable`               |
| `packages/shared/src/dto/daily-sheet.dto.ts`               | Eliminado `developerId` de `DailyEntryDto`                                                                 |
| `apps/api/src/modules/reports/reports.service.ts`          | Reescrito completo para nuevo schema                                                                       |
| `apps/api/src/modules/jira-sync/jira-sync.service.ts`      | Usa `fields: 'worklog,components'`, matchea por `Component.name`, upsert con `jiraAccountId + componentId` |
| `apps/api/src/modules/projects/projects.service.ts`        | Sin jerarquía, incluye `components`, añade CRUD de Component                                               |
| `apps/api/src/modules/projects/projects.controller.ts`     | Añade endpoints de Component, IDs numéricos con `+id`                                                      |
| `apps/api/src/modules/developers/developers.service.ts`    | `jiraAccountId` requerido, IDs `Int`                                                                       |
| `apps/api/src/modules/developers/developers.controller.ts` | IDs numéricos con `+id`                                                                                    |
| `apps/api/src/modules/worklogs/worklogs.service.ts`        | Usa `componentId + jiraAccountId`, elimina `projectId/developerId/isBillable`                              |
| `apps/api/src/modules/worklogs/worklogs.controller.ts`     | Body types actualizados                                                                                    |
| `apps/web/src/pages/Manage.tsx`                            | Añade `ComponentPanel`, interfaces con IDs `number`                                                        |
| `apps/web/src/components/manage/ComponentPanel.tsx`        | **Nuevo** — CRUD de Components                                                                             |
| `apps/web/src/components/manage/ProjectPanel.tsx`          | Interface con `id: number`, `monthlyBudget: number`                                                        |
| `apps/web/src/components/manage/DeveloperPanel.tsx`        | Interface con `id: number`, `jiraAccountId: string` (requerido)                                            |
| `apps/web/src/components/manage/DeveloperForm.tsx`         | Interface actualizada                                                                                      |
| `apps/web/src/components/manage/ProjectForm.tsx`           | Interface actualizada                                                                                      |

---

## Nuevos endpoints

| Método   | Ruta                           | Descripción                    |
| -------- | ------------------------------ | ------------------------------ |
| `GET`    | `/projects/:id/components`     | Lista components de un project |
| `POST`   | `/projects/:id/components`     | Crea un component              |
| `PATCH`  | `/projects/components/:compId` | Actualiza un component         |
| `DELETE` | `/projects/components/:compId` | Elimina un component           |

---

## Decisiones de diseño

- `Worklog.jiraAccountId` es un `String` plano, **no FK**. Los reportes joinean manualmente con `Developer.jiraAccountId`.
- `isBillable` vive en `Component`, no en `Worklog`. Un worklog es billable si su component lo es.
- Jira sync: si el issue no tiene componente en Jira → worklog se **skipea**.
- `Component.name` es `@unique` — se matchea con `issue.fields.components[0].name` (case-sensitive, el lookup usa `findUnique`).
- `slackId` en Developer es `String? @unique` (opcional, único cuando presente).

---

---

## Refactor #2 — `ticketKey` + `assigned` (Abril 2026)

### Objetivo

Desacoplar Worklog de las IDs internas de Jira. En lugar de guardar el ID numérico del issue (`jiraIssueId`) y el account ID del autor (`jiraAccountId`), se usa:

- **`ticketKey`** — clave legible del ticket (ej. `MGS-123`), globalmente única por row.
- **`assigned`** — email del developer que registró el log (string plano, no FK).
- Se elimina `Developer.jiraAccountId` por completo.

### Cambios en el schema

**Developer** — eliminado `jiraAccountId`:

```prisma
model Developer {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  slackId   String?  @unique @map("slack_id")
  ...
}
```

**Worklog** — `jiraIssueId` + `jiraAccountId` → `ticketKey` + `assigned`:

```prisma
model Worklog {
  id          Int       @id @default(autoincrement())
  hours       Float
  date        DateTime  @db.Date
  ticketKey   String    @unique @map("ticket_key")
  assigned    String
  componentId Int       @map("component_id")
  ...
  @@index([componentId, date])
  @@index([assigned, date])
}
```

### Comandos ejecutados

```bash
# Reset de la DB (re-aplica la migración base)
npx prisma migrate reset --force --schema=packages/db/prisma/schema.prisma

# Nueva migración con los cambios
npx prisma migrate dev --name "refactor_worklog_assigned" --schema=packages/db/prisma/schema.prisma

# Seed
cd packages/db && npx ts-node prisma/seed.ts
```

Migración generada en:

```
packages/db/prisma/migrations/20260425174355_refactor_worklog_assigned/migration.sql
```

Resultado del seed: `{ projects: 3, components: 6, developers: 4, worklogs: 268 }`

### Archivos modificados

| Archivo                                                    | Qué cambió                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `packages/db/prisma/schema.prisma`                         | Eliminado `jiraAccountId` de Developer; reemplazados `jiraIssueId`/`jiraAccountId` por `ticketKey`/`assigned` en Worklog |
| `packages/db/prisma/seed.ts`                               | Developers sin `jiraAccountId`; worklogs usan `ticketKey: \`seed-wl-${n}\``+`assigned: dev.email`                        |
| `apps/api/src/modules/jira-sync/jira-sync.service.ts`      | Lookup de developer por `email` (no accountId); upsert por `ticketKey: issue.key`; eliminado `console.log` de debug      |
| `apps/api/src/modules/reports/reports.service.ts`          | `getDeveloperWorkload` y `getDailySheet` agrupan/mapean por `w.assigned`/`d.email`                                       |
| `apps/api/src/modules/worklogs/worklogs.service.ts`        | `create()` usa `ticketKey` + `assigned`                                                                                  |
| `apps/api/src/modules/worklogs/worklogs.controller.ts`     | Body type actualizado                                                                                                    |
| `apps/api/src/modules/developers/developers.service.ts`    | Eliminado `jiraAccountId` de `create()` y `update()`                                                                     |
| `apps/api/src/modules/developers/developers.controller.ts` | Eliminado `jiraAccountId` de todos los body types                                                                        |
| `apps/web/src/components/manage/DeveloperForm.tsx`         | Eliminado campo Jira Account ID                                                                                          |
| `apps/web/src/components/manage/DeveloperPanel.tsx`        | Eliminada columna "Jira ID" de la tabla                                                                                  |
| `apps/web/src/pages/Manage.tsx`                            | Eliminado `jiraAccountId` de la interfaz `Developer`                                                                     |

### Decisiones de diseño

- `ticketKey` era `@unique` en esta fase — corregido en Refactor #3.
- Si `author.emailAddress` del worklog de Jira no coincide con ningún `Developer.email` → el worklog se **skipea** con un `logger.warn`.
- `Worklog.assigned` es un `String` plano, **no FK** — el join con Developer se hace por email en los servicios de reportes.

---

## Refactor #3 — `jiraWorklogId` como clave de upsert (Abril 2026)

### Problema identificado

El Refactor #2 usaba `ticketKey @unique` como clave de upsert, asumiendo 1 ticket = 1 worklog. Eso es incorrecto: un ticket en Jira puede tener múltiples worklogs (distintos developers, múltiples entradas del mismo developer). La clave verdaderamente única es `worklog.id` de Jira.

### Cambios en el schema

**Worklog** — `ticketKey` deja de ser `@unique`; se añade `jiraWorklogId` como clave de upsert:

```prisma
model Worklog {
  id             Int       @id @default(autoincrement())
  jiraWorklogId  String    @unique @map("jira_worklog_id")
  ticketKey      String    @map("ticket_key")
  hours          Float
  date           DateTime  @db.Date
  assigned       String
  componentId    Int       @map("component_id")
  ...
  @@index([componentId, date])
  @@index([assigned, date])
  @@index([ticketKey])
}
```

### Mapping del payload de Jira

| Campo Jira                        | Campo DB        |
| --------------------------------- | --------------- |
| `worklog.id`                      | `jiraWorklogId` |
| `issue.key`                       | `ticketKey`     |
| `worklog.author.emailAddress`     | `assigned`      |
| `worklog.timeSpentSeconds / 3600` | `hours`         |

### Comandos ejecutados

```bash
npx prisma migrate reset --force --schema=packages/db/prisma/schema.prisma
npx prisma migrate dev --name "add_jira_worklog_id" --schema=packages/db/prisma/schema.prisma
cd packages/db && npx ts-node prisma/seed.ts
```

Migración: `20260426021301_add_jira_worklog_id`

Resultado del seed: `{ projects: 3, components: 6, developers: 4, worklogs: 279 }`

### Archivos modificados

| Archivo                                                | Qué cambió                                                                                         |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `packages/db/prisma/schema.prisma`                     | `ticketKey` deja de ser `@unique`; añadido `jiraWorklogId @unique`; añadido `@@index([ticketKey])` |
| `packages/db/prisma/seed.ts`                           | Worklogs incluyen `jiraWorklogId: \`seed-wl-${n}\`` + `ticketKey: \`SEED-${n}\``                   |
| `apps/api/src/modules/jira-sync/jira-sync.service.ts`  | Upsert cambia a `where: { jiraWorklogId: wl.id }`; `create` incluye `jiraWorklogId` + `ticketKey`  |
| `apps/api/src/modules/worklogs/worklogs.service.ts`    | `create()` incluye `jiraWorklogId` como campo requerido                                            |
| `apps/api/src/modules/worklogs/worklogs.controller.ts` | Body type incluye `jiraWorklogId`                                                                  |

### Decisiones de diseño

- `jiraWorklogId` es la **única** clave de upsert — no hay compound keys.
- `ticketKey` es informacional (para UI y readability), no sirve para deduplicación.
- Múltiples rows en Worklog pueden compartir el mismo `ticketKey` (distintos developers logueando en el mismo ticket).

---

## Cómo resetear de nuevo (si hace falta)

```bash
# Opción A: reset completo (borra datos + migraciones + re-aplica desde cero)
npx prisma migrate reset --force --schema=packages/db/prisma/schema.prisma

# Opción B: solo re-correr el seed (sin tocar migraciones)
cd packages/db && npx ts-node prisma/seed.ts

# Opción C: borrar la DB de Docker completamente
docker compose down -v          # borra el volumen
docker compose up -d            # levanta de nuevo
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
cd packages/db && npx ts-node prisma/seed.ts
```
