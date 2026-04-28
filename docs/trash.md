# Trash (Soft Delete) — Documentación

## Descripción general

El sistema de borrado lógico (*soft delete*) permite eliminar proyectos, componentes y desarrolladores sin destruir datos. Los registros eliminados se marcan con `deletedAt` y quedan visibles en la pestaña **Trash** del panel Manage, donde pueden restaurarse individualmente.

No existe borrado permanente. Toda eliminación es reversible.

---

## Schema

Los tres modelos afectados tienen el campo:

```prisma
deletedAt  DateTime?  @map("deleted_at")
```

| Modelo | Campo único que sigue siendo único |
|---|---|
| `Project` | — (nombre no restringido) |
| `Component` | nombre único entre activos (aplicado en capa de servicio) |
| `Developer` | `email @unique` (en DB), verificado también en restore |

---

## Comportamiento de borrado

### Cascade automático (borrado)

La relación Project ↔ Component es 1:1. Al eliminar uno, el otro se elimina automáticamente con el mismo timestamp.

| Acción del usuario | Efecto automático |
|---|---|
| Eliminar proyecto | Su componente activo pasa a `deletedAt = now` |
| Eliminar componente | Su proyecto activo pasa a `deletedAt = now` |

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

| Método | Ruta | Descripción |
|---|---|---|
| `DELETE` | `/projects/:id` | Soft-delete del proyecto + cascade al componente activo |
| `PATCH` | `/projects/:id/restore` | Restaura el proyecto (sin cascade) |
| `PATCH` | `/projects/:id/restore?cascade=1` | Restaura el proyecto **y** todos sus componentes eliminados |

**Restore sin cascade — validación:**
- Si ya existe un proyecto activo con el mismo nombre → `409 Conflict`

**Restore con cascade — validaciones:**
- Mismo chequeo de nombre para el proyecto
- Por cada componente a restaurar: verifica que no exista otro componente activo con ese nombre → `409 Conflict` si hay conflicto

---

### Componentes

| Método | Ruta | Descripción |
|---|---|---|
| `DELETE` | `/projects/components/:id` | Soft-delete del componente + cascade al proyecto activo |
| `PATCH` | `/projects/components/:id/restore` | Restaura el componente (sin cascade) |

**Restore — validaciones:**
- Si existe otro componente activo con el mismo nombre → `409 Conflict`

**Creación — validación 1:1:**
- Un proyecto solo puede tener un componente activo a la vez
- Intentar crear un segundo componente para el mismo proyecto → `409 Conflict`: `"Project already has component '…'. Remove it first."`

---

### Desarrolladores

| Método | Ruta | Descripción |
|---|---|---|
| `DELETE` | `/developers/:id` | Soft-delete del desarrollador |
| `PATCH` | `/developers/:id/restore` | Restaura el desarrollador |

**Restore — validación:**
- Si ya existe un desarrollador activo con el mismo email → `409 Conflict`

**Nota:** los worklogs no tienen FK a `Developer` (usan `assigned: String`). Eliminar un desarrollador no afecta la integridad referencial de los worklogs, pero sus horas dejan de aparecer en todos los reportes.

---

## Frontend — Pestaña Trash

Ubicación: **Manage → Trash**

La pestaña muestra tres secciones: Deleted Projects, Deleted Components, Deleted Developers. Si no hay registros eliminados, muestra el mensaje "No deleted items".

### Columnas por sección

**Deleted Projects**

| Columna | Descripción |
|---|---|
| Name | Nombre del proyecto |
| Budget | Presupuesto mensual en horas |
| Components in Trash | Cantidad de componentes del proyecto que están eliminados |
| Deleted At | Fecha de eliminación |
| Actions | Botón Restore / Restore+Comps |

Si el proyecto tiene componentes en trash → el botón muestra **Restore+Comps** (llama a `?cascade=1`). Si no → **Restore** simple.

**Deleted Components**

| Columna | Descripción |
|---|---|
| Name | Nombre del componente |
| Project | Proyecto al que pertenece (puede estar también eliminado) |
| Billable | Badge Billable / Non-Billable |
| Deleted At | Fecha de eliminación |
| Actions | Botón Restore |

**Deleted Developers**

| Columna | Descripción |
|---|---|
| Name | Nombre del desarrollador |
| Email | Email |
| Deleted At | Fecha de eliminación |
| Actions | Botón Restore |

### Comportamiento de restauración en UI

1. El usuario hace clic en **Restore**
2. El botón queda deshabilitado (loading state con `…`)
3. Si el servidor responde `200` → toast de éxito + refetch de la lista
4. Si el servidor responde `409` → toast de error con el mensaje de conflicto (ej. `"A project named 'X' already exists."`)
5. El usuario debe resolver el conflicto manualmente (renombrar el registro activo desde la pestaña Projects/Components) antes de volver a intentar restaurar

---

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `packages/db/prisma/schema.prisma` | Campos `deletedAt` en Project, Component, Developer |
| `apps/api/src/modules/projects/projects.service.ts` | Soft-delete, restore, cascade |
| `apps/api/src/modules/projects/projects.controller.ts` | Endpoints de proyecto y componente |
| `apps/api/src/modules/developers/developers.service.ts` | Soft-delete y restore de developers |
| `apps/api/src/modules/developers/developers.controller.ts` | Endpoints de developer |
| `apps/api/src/modules/trash/trash.service.ts` | Query consolidada `GET /trash` |
| `apps/api/src/modules/trash/trash.controller.ts` | Controlador de trash |
| `apps/api/src/modules/trash/trash.module.ts` | Módulo NestJS |
| `apps/api/src/modules/reports/reports.service.ts` | Filtros de soft-delete en todas las queries de reportes |
| `apps/web/src/pages/Manage.tsx` | Layout tabbed (Developers / Projects / Components / Trash) |
| `apps/web/src/components/manage/TrashPanel.tsx` | UI de la pestaña Trash |
