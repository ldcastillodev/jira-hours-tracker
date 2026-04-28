# Proyectos No Facturables — Documentación

## Descripción general

Un proyecto es **no facturable** cuando su componente tiene `isBillable = false`. Para estos proyectos no hay presupuesto mensual contratado, por lo que no se muestran indicadores de excedido ni barras de progreso.

Los proyectos no facturables siguen apareciendo en el dashboard con sus horas trabajadas reales.

---

## Schema

El campo `monthlyBudget` en `Project` ahora es nullable:

```prisma
model Project {
  monthlyBudget  Float?  @map("monthly_budget")
}
```

Migración aplicada: `20260428162622_nullable_monthly_budget`

---

## Lógica de negocio

### Determinación de billability

Un proyecto es no facturable si `project.components[0]?.isBillable === false`. Dado que la relación es 1:1, siempre hay como máximo un componente activo.

### Cálculo de horas (`GET /reports/client-hours`)

| Campo | Proyecto facturable | Proyecto no facturable |
|---|---|---|
| `isBillable` | `true` | `false` |
| `contracted` | `monthlyBudget ?? 0` | `0` |
| `used` | suma real de worklogs | suma real de worklogs |
| `remaining` | `contracted - used` | `0` |
| `percentUsed` | `(used / contracted) * 100` | `0` |

### Totales del resumen (`ClientHoursSummaryDto`)

| Campo | Incluye no facturables |
|---|---|
| `totalContracted` | No |
| `totalUsed` | Sí |
| `totalRemaining` | No |
| `overBudgetCount` | No |

---

## Backend

### `packages/shared/src/dto/client-hours.dto.ts`

Se añadió `isBillable: boolean` a `ClientHoursDto`:

```typescript
export interface ClientHoursDto {
  projectId: number;
  projectName: string;
  isBillable: boolean;
  contracted: number;
  used: number;
  remaining: number;
  percentUsed: number;
}
```

### `apps/api/src/modules/projects/projects.service.ts`

`create()` y `update()` aceptan `monthlyBudget?: number | null`.

### `apps/api/src/modules/reports/reports.service.ts`

`getClientHours()` derivando `isBillable` del primer componente del proyecto y aplicando la lógica de cálculo diferenciada. Los totales billable/total se calculan por separado.

---

## Frontend

### Dashboard (`apps/web/src/pages/Dashboard.tsx`)

Las stat cards de "Total Contratadas", "Horas Restantes" y "Clientes Excedidos" reflejan solo proyectos facturables (excluidos de los totales en backend). La stat card "Horas Usadas" tiene un guard de división por cero: muestra `—%` si `totalContracted === 0`.

### Tabla de clientes (`apps/web/src/components/ui/ClientTable.tsx`)

Se divide en dos secciones independientes:

**Clientes Facturables** — columnas: Cliente · Contratadas · Usadas · Restantes · % Usado (con badge EXCEDIDO y barra de progreso).

**Clientes No Facturables** — columnas: Cliente · Horas Usadas (sin columnas de presupuesto).

Cada sección solo se renderiza si tiene datos.

### Gráfico de barras (`apps/web/src/components/charts/ClientHoursChart.tsx`)

Se divide en dos gráficos apilados:

- **Facturables** (si los hay): 3 datasets — Contratadas (azul), Usadas (verde), Restantes/Excedente (morado/rojo). Altura: 340 px.
- **No Facturables** (si los hay): 1 dataset — Horas Usadas (morado). Altura: 240 px.

### Trash panel (`apps/web/src/components/manage/TrashPanel.tsx`)

La columna Budget muestra `—` cuando `monthlyBudget` es `null`.

---

## Archivos modificados

| Archivo | Qué cambió |
|---|---|
| `packages/db/prisma/schema.prisma` | `monthlyBudget Float` → `Float?` |
| `packages/db/prisma/migrations/20260428162622_nullable_monthly_budget/` | Migración generada |
| `packages/shared/src/dto/client-hours.dto.ts` | Añadido `isBillable: boolean` |
| `apps/api/src/modules/reports/reports.service.ts` | Lógica no facturable en `getClientHours()` |
| `apps/api/src/modules/projects/projects.service.ts` | `monthlyBudget` acepta `null` en create/update |
| `apps/web/src/pages/Dashboard.tsx` | Guard de división por cero en stat card |
| `apps/web/src/components/ui/ClientTable.tsx` | Split en dos secciones por billability |
| `apps/web/src/components/charts/ClientHoursChart.tsx` | Split en dos gráficos por billability |
| `apps/web/src/components/manage/TrashPanel.tsx` | `monthlyBudget` nullable, muestra `—` |
| `apps/web/src/components/manage/ProjectPanel.tsx` | `monthlyBudget: number \| null` |
| `apps/web/src/components/manage/ProjectForm.tsx` | `monthlyBudget: number \| null` |
| `apps/web/src/pages/Manage.tsx` | `monthlyBudget: number \| null` |
