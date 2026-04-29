# Inactive Records (Soft Delete) — Documentación

> **Terminology:** As of Phase 8, the concept formerly called "Trash" is now called **Inactive**. The UI tab is "Inactive", action buttons say "Activate" (formerly "Restore"), and API endpoints use `/inactive` and `/activate`. The database field `deletedAt` is unchanged — it is internal.

---

## Overview

The soft-delete system allows projects, components, and developers to be **deactivated** without destroying data. Records are marked with `deletedAt` and remain visible under **Manage → Inactive**, where they can be activated individually.

There is no permanent deletion. All deactivation is reversible.

Inactive records with worklogs **still appear in dashboards and reports**. Only inactive records with zero hours in the period are excluded from report output.

---

## Schema

All three affected models have:

```prisma
deletedAt  DateTime?  @map("deleted_at")
```

| Model       | Unique constraint                                            |
| ----------- | ------------------------------------------------------------ |
| `Project`   | — (name not constrained while inactive)                      |
| `Component` | unique name among active records (enforced in service layer) |
| `Developer` | `email @unique` in DB, also verified on activate             |

---

## Deactivation (Soft Delete) Behavior

### Automatic cascade (on delete)

Project ↔ Component is a 1:1 relationship. Deactivating one automatically deactivates the other with the same timestamp.

| User action      | Automatic effect                                 |
| ---------------- | ------------------------------------------------ |
| Delete project   | Its active component is set to `deletedAt = now` |
| Delete component | Its active project is set to `deletedAt = now`   |

### No cascade on activation

Activation is always manual and independent. Activating a project does **not** activate its components, and vice versa. The user can activate each from the Inactive tab separately.

**Activate+Comps option:** When a project has inactive components, a single button activates the project and all its inactive components in one call (`?cascade=1`).

---

## Impact on Reports and Dashboards

As of Phase 8, the report query strategy changed from _exclude-by-default_ to _include-if-has-worklogs_.

### Previous behavior (before Phase 8)

All report queries applied three hard filters:

1. `component.deletedAt = null`
2. `component.project.deletedAt = null`
3. Email of `assigned` must belong to an active developer

Inactive records were **always excluded** from all reports, even if they had hours.

### Current behavior (Phase 8+)

| Report endpoint                   | Inactive records included?                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `GET /reports/client-hours`       | ✅ Inactive projects included **if** they have worklogs in the period                  |
| `GET /reports/developer-workload` | ✅ Inactive developers included **if** they have worklogs in the period                |
| `GET /reports/client-summary`     | ✅ Inactive components included **if** they have worklogs in the period                |
| `GET /reports/daily-sheet`        | ✅ All worklogs for the day included regardless of entity status                       |
| `GET /reports/custom`             | ✅ Inactive developers/components/projects included if they have worklogs in the range |

**Inactive records with zero hours** in the period are never fetched (not filtered out — they simply produce no rows in worklog queries) and therefore never appear in report output.

### `getClientHours` — two-query implementation

This endpoint is project-first (not worklog-first), so it uses a split approach:

1. **Query 1:** All active projects with their components and period worklogs (unchanged).
2. **Query 2:** Worklogs in the period where the component's project is inactive. These are grouped by `projectId` and merged into the client list as inactive project entries.

Active projects always appear (even at 0h, for budget tracking). Inactive projects appear only if Query 2 returns rows for them.

### Inactive projects in over-budget / near-limit cards

Inactive projects that have worklogs in the period participate in budget calculations normally — they can appear in the over-budget count and near-limit list if they qualify.

---

## Backend — Endpoints

### GET `/inactive`

Returns all inactive records grouped by type.

```json
{
  "projects": [...],
  "components": [...],
  "developers": [...]
}
```

Each project includes its `components` array (both active and inactive). Each component includes its embedded `project`.

---

### Projects

| Method   | Path                               | Description                                              |
| -------- | ---------------------------------- | -------------------------------------------------------- |
| `DELETE` | `/projects/:id`                    | Soft-delete project + cascade to active component        |
| `PATCH`  | `/projects/:id/activate`           | Activate the project (no cascade)                        |
| `PATCH`  | `/projects/:id/activate?cascade=1` | Activate the project **and** all its inactive components |

**Activate without cascade — validation:**

- If an active project with the same name already exists → `409 Conflict`

**Activate with cascade — validations:**

- Same name check for the project
- For each component to activate: verify no other active component has that name → `409 Conflict` if conflict

---

### Components

| Method   | Path                                | Description                                       |
| -------- | ----------------------------------- | ------------------------------------------------- |
| `DELETE` | `/projects/components/:id`          | Soft-delete component + cascade to active project |
| `PATCH`  | `/projects/components/:id/activate` | Activate the component (no cascade)               |

**Activate — validation:**

- If another active component with the same name exists → `409 Conflict`

**Create — 1:1 enforcement:**

- A project can only have one active component at a time
- Attempting to create a second component for the same project → `409 Conflict`: `"Project already has component '…'. Remove it first."`

---

### Developers

| Method   | Path                       | Description               |
| -------- | -------------------------- | ------------------------- |
| `DELETE` | `/developers/:id`          | Soft-delete the developer |
| `PATCH`  | `/developers/:id/activate` | Activate the developer    |

**Activate — validation:**

- If an active developer with the same email already exists → `409 Conflict`

**Note:** Worklogs have no FK to `Developer` (they use `assigned: String`). Deactivating a developer does not affect worklog referential integrity. Their hours **do** now appear in reports (Phase 8), unlike before when they were excluded.

---

## Frontend — Inactive Tab

Location: **Manage → Inactive**

The tab shows three sections: Inactive Projects, Inactive Components, Inactive Developers. If there are no inactive records, it shows "No inactive items".

### Columns by section

**Inactive Projects**

| Column              | Description                                |
| ------------------- | ------------------------------------------ |
| Name                | Project name                               |
| Budget              | Monthly budget in hours                    |
| Components Inactive | Count of the project's inactive components |
| Deactivated At      | Date of deactivation                       |
| Actions             | **Activate** / **Activate+Comps**          |

If the project has inactive components → button shows **Activate+Comps** (calls `?cascade=1`). Otherwise → **Activate**.

**Inactive Components**

| Column         | Description                           |
| -------------- | ------------------------------------- |
| Name           | Component name                        |
| Project        | Parent project (may also be inactive) |
| Billable       | Badge: Billable / Non-Billable        |
| Deactivated At | Date of deactivation                  |
| Actions        | **Activate**                          |

**Inactive Developers**

| Column         | Description          |
| -------------- | -------------------- |
| Name           | Developer name       |
| Email          | Email                |
| Deactivated At | Date of deactivation |
| Actions        | **Activate**         |

### Activation flow in UI

1. User clicks **Activate**
2. Button becomes disabled (loading state `…`)
3. If server responds `200` → success toast + refetch of the list
4. If server responds `409` → error toast with the conflict message (e.g. `"A project named 'X' already exists."`)
5. User must resolve the conflict manually (rename the active record from the Projects/Components tab) before retrying activation

---

## Files Involved

| File                                                                | Role                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------- |
| `packages/db/prisma/schema.prisma`                                  | `deletedAt` fields on Project, Component, Developer           |
| `apps/api/src/modules/projects/projects.service.ts`                 | Soft-delete, activate, cascade                                |
| `apps/api/src/modules/projects/projects.controller.ts`              | Project and component endpoints                               |
| `apps/api/src/modules/developers/developers.service.ts`             | Soft-delete and activate for developers                       |
| `apps/api/src/modules/developers/developers.controller.ts`          | Developer endpoints                                           |
| `apps/api/src/modules/inactive/inactive.service.ts`                 | Consolidated `GET /inactive` query                            |
| `apps/api/src/modules/inactive/inactive.controller.ts`              | Inactive controller                                           |
| `apps/api/src/modules/inactive/inactive.module.ts`                  | NestJS module                                                 |
| `apps/api/src/modules/reports/reports.service.ts`                   | Inclusive query logic for all report endpoints                |
| `apps/web/src/components/pages/Manage/Manage.tsx`                   | Tabbed layout (Developers / Projects / Components / Inactive) |
| `apps/web/src/components/organisms/InactivePanel/InactivePanel.tsx` | Inactive tab UI                                               |

---

## Schema

Los tres modelos afectados tienen el campo:

```prisma
deletedAt  DateTime?  @map("deleted_at")
```

| Modelo      | Campo único que sigue siendo único                        |
| ----------- | --------------------------------------------------------- |
| `Project`   | — (nombre no restringido)                                 |
| `Component` | nombre único entre activos (aplicado en capa de servicio) |
| `Developer` | `email @unique` (en DB), verificado también en restore    |

---

## Comportamiento de borrado

### Cascade automático (borrado)

La relación Project ↔ Component es 1:1. Al eliminar uno, el otro se elimina automáticamente con el mismo timestamp.

| Acción del usuario  | Efecto automático                             |
| ------------------- | --------------------------------------------- |
| Eliminar proyecto   | Su componente activo pasa a `deletedAt = now` |
| Eliminar componente | Su proyecto activo pasa a `deletedAt = now`   |

### Sin cascade en restauración

La restauración es siempre manual e independiente. Al restaurar un proyecto su componente **no** se restaura, y viceversa. El usuario puede restaurar cada uno desde Trash de forma separada.

**Caso edge:** componente restaurado con su proyecto aún eliminado → el componente queda activo pero sin proyecto activo → los worklogs vinculados a ese componente son excluidos de todos los reportes (porque el filtro de queries requiere `component.project.deletedAt = null`).

---

## Impacto en reportes y dashboards

Todas las queries de worklogs aplican estos tres filtros:

1. `component.deletedAt = null` — excluye worklogs de componentes eliminados
2. `component.project.deletedAt = null` — excluye worklogs de proyectos eliminados
3. Email del `assigned` debe pertenecer a un desarrollador activo (`deletedAt = null`)

El tercer filtro se aplica en capa de aplicación: se obtiene el set de emails activos y se filtran los worklogs antes de construir el resultado.

Endpoints afectados:

- `GET /reports/project-hours`
- `GET /reports/developer-hours`
- `GET /reports/client-summary`
- `GET /reports/daily-sheet`
- `GET /reports/custom`

---

## Backend — Endpoints

### GET `/trash`

Retorna todos los registros soft-deleted agrupados.

```json
{
  "projects": [...],
  "components": [...],
  "developers": [...]
}
```

Cada proyecto incluye su array `components` (activos y eliminados). Cada componente incluye su `project` embebido.

---

### Proyectos

| Método   | Ruta                              | Descripción                                                 |
| -------- | --------------------------------- | ----------------------------------------------------------- |
| `DELETE` | `/projects/:id`                   | Soft-delete del proyecto + cascade al componente activo     |
| `PATCH`  | `/projects/:id/restore`           | Restaura el proyecto (sin cascade)                          |
| `PATCH`  | `/projects/:id/restore?cascade=1` | Restaura el proyecto **y** todos sus componentes eliminados |

**Restore sin cascade — validación:**

- Si ya existe un proyecto activo con el mismo nombre → `409 Conflict`

**Restore con cascade — validaciones:**

- Mismo chequeo de nombre para el proyecto
- Por cada componente a restaurar: verifica que no exista otro componente activo con ese nombre → `409 Conflict` si hay conflicto

---

### Componentes

| Método   | Ruta                               | Descripción                                             |
| -------- | ---------------------------------- | ------------------------------------------------------- |
| `DELETE` | `/projects/components/:id`         | Soft-delete del componente + cascade al proyecto activo |
| `PATCH`  | `/projects/components/:id/restore` | Restaura el componente (sin cascade)                    |

**Restore — validaciones:**

- Si existe otro componente activo con el mismo nombre → `409 Conflict`

**Creación — validación 1:1:**

- Un proyecto solo puede tener un componente activo a la vez
- Intentar crear un segundo componente para el mismo proyecto → `409 Conflict`: `"Project already has component '…'. Remove it first."`

---

### Desarrolladores

| Método   | Ruta                      | Descripción                   |
| -------- | ------------------------- | ----------------------------- |
| `DELETE` | `/developers/:id`         | Soft-delete del desarrollador |
| `PATCH`  | `/developers/:id/restore` | Restaura el desarrollador     |

**Restore — validación:**

- Si ya existe un desarrollador activo con el mismo email → `409 Conflict`

**Nota:** los worklogs no tienen FK a `Developer` (usan `assigned: String`). Eliminar un desarrollador no afecta la integridad referencial de los worklogs, pero sus horas dejan de aparecer en todos los reportes.

---

## Frontend — Pestaña Trash

Ubicación: **Manage → Trash**

La pestaña muestra tres secciones: Deleted Projects, Deleted Components, Deleted Developers. Si no hay registros eliminados, muestra el mensaje "No deleted items".

### Columnas por sección

**Deleted Projects**

| Columna             | Descripción                                               |
| ------------------- | --------------------------------------------------------- |
| Name                | Nombre del proyecto                                       |
| Budget              | Presupuesto mensual en horas                              |
| Components in Trash | Cantidad de componentes del proyecto que están eliminados |
| Deleted At          | Fecha de eliminación                                      |
| Actions             | Botón Restore / Restore+Comps                             |

Si el proyecto tiene componentes en trash → el botón muestra **Restore+Comps** (llama a `?cascade=1`). Si no → **Restore** simple.

**Deleted Components**

| Columna    | Descripción                                               |
| ---------- | --------------------------------------------------------- |
| Name       | Nombre del componente                                     |
| Project    | Proyecto al que pertenece (puede estar también eliminado) |
| Billable   | Badge Billable / Non-Billable                             |
| Deleted At | Fecha de eliminación                                      |
| Actions    | Botón Restore                                             |

**Deleted Developers**

| Columna    | Descripción              |
| ---------- | ------------------------ |
| Name       | Nombre del desarrollador |
| Email      | Email                    |
| Deleted At | Fecha de eliminación     |
| Actions    | Botón Restore            |

### Comportamiento de restauración en UI

1. El usuario hace clic en **Restore**
2. El botón queda deshabilitado (loading state con `…`)
3. Si el servidor responde `200` → toast de éxito + refetch de la lista
4. Si el servidor responde `409` → toast de error con el mensaje de conflicto (ej. `"A project named 'X' already exists."`)
5. El usuario debe resolver el conflicto manualmente (renombrar el registro activo desde la pestaña Projects/Components) antes de volver a intentar restaurar

---

## Archivos involucrados

| Archivo                                                    | Rol                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/db/prisma/schema.prisma`                         | Campos `deletedAt` en Project, Component, Developer        |
| `apps/api/src/modules/projects/projects.service.ts`        | Soft-delete, restore, cascade                              |
| `apps/api/src/modules/projects/projects.controller.ts`     | Endpoints de proyecto y componente                         |
| `apps/api/src/modules/developers/developers.service.ts`    | Soft-delete y restore de developers                        |
| `apps/api/src/modules/developers/developers.controller.ts` | Endpoints de developer                                     |
| `apps/api/src/modules/trash/trash.service.ts`              | Query consolidada `GET /trash`                             |
| `apps/api/src/modules/trash/trash.controller.ts`           | Controlador de trash                                       |
| `apps/api/src/modules/trash/trash.module.ts`               | Módulo NestJS                                              |
| `apps/api/src/modules/reports/reports.service.ts`          | Filtros de soft-delete en todas las queries de reportes    |
| `apps/web/src/pages/Manage.tsx`                            | Layout tabbed (Developers / Projects / Components / Trash) |
| `apps/web/src/components/manage/TrashPanel.tsx`            | UI de la pestaña Trash                                     |
