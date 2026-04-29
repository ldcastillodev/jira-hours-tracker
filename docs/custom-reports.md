# Custom Reports — Documentación

## Descripción general

Módulo de reportes personalizados accesible en `/reports/custom`. Permite filtrar worklogs por período, proyecto y desarrollador, visualizarlos en un gráfico de barras apilado y exportarlos a HTML interactivo o Excel.

---

## Backend

### Endpoint

```
GET /reports/custom
```

#### Query params

| Parámetro         | Tipo                       | Requerido | Descripción                 |
| ----------------- | -------------------------- | --------- | --------------------------- |
| `period`          | `day` \| `week` \| `month` | ✅        | Granularidad del reporte    |
| `startDate`       | `YYYY-MM-DD`               | ✅        | Fecha de inicio del período |
| `projectIds`      | `1,2,3` (CSV)              | No        | Filtrar por proyectos       |
| `developerEmails` | `a@b.com,c@d.com` (CSV)    | No        | Filtrar por desarrolladores |

#### Lógica de rango de fechas (`computeDateRange`)

- **day:** `[startDate, startDate + 1 día)`
- **week:** `[lunes de la semana, lunes siguiente)` — semana calendario completa lun–dom
- **month:** `[1° del mes, 1° del mes siguiente)`

#### Respuesta (`CustomReportDto`)

```typescript
{
  period: 'day' | 'week' | 'month';
  startDate: string;        // YYYY-MM-DD (inclusive)
  endDate: string;          // YYYY-MM-DD (exclusivo)
  filters: {
    projectIds: number[];
    developerEmails: string[];
  };
  summary: {
    totalHours: number;
    billableHours: number;
    nonBillableHours: number;
    worklogs: number;
  };
  timeline: {               // zero-filled para eje X continuo
    date: string;
    billableHours: number;
    nonBillableHours: number;
  }[];
  details: {
    date: string;
    developer: string;      // email
    project: string;        // nombre (no ID)
    component: string;
    ticketKey: string;
    jiraWorklogId: string;
    hours: number;
    billable: boolean;
  }[];
}
```

### Archivos modificados

| Archivo                                              | Cambio                                             |
| ---------------------------------------------------- | -------------------------------------------------- |
| `apps/api/src/modules/reports/reports.service.ts`    | Método `getCustomReport(params)`                   |
| `apps/api/src/modules/reports/reports.controller.ts` | `GET /reports/custom` con validación de parámetros |
| `packages/shared/src/dto/custom-report.dto.ts`       | DTOs del reporte                                   |
| `packages/shared/src/index.ts`                       | Re-export de `custom-report.dto`                   |

---

## Frontend

### Ruta y navegación

- Ruta: `/reports/custom`
- Componente: `apps/web/src/pages/CustomReports.tsx`
- Nav tab: "Reports" en `AppShell.tsx` — oculta el `MonthPicker` global

### Componentes

#### `CustomReports.tsx` — Página principal

Flujo de datos:

1. Carga `/projects` y `/developers` con `useApi`
2. `handleGenerate()` llama a `GET /reports/custom` con los filtros
3. `report.details[]` se filtra en el cliente según las tabs activas (Developer → Project)
4. El `buildTimeline()` re-agrupa los detalles filtrados en un mini-timeline para el gráfico

**Estado principal:**

| Estado           | Descripción                                     |
| ---------------- | ----------------------------------------------- |
| `report`         | Resultado de la API (`CustomReportDto \| null`) |
| `activeDevTab`   | Email del developer activo, o `'__all__'`       |
| `activeProjTab`  | Nombre del proyecto activo, o `'__all__'`       |
| `activeChartRef` | Ref al `ChartJS` del tab visible (para export)  |

**Sección de tabs del gráfico:**

- L1: "All Developers" + un tab por email único en `report.details`
- L2: visible solo cuando hay >1 proyecto — "All Projects" + un tab por proyecto
- Cambiar L1 resetea L2 a `'__all__'`
- El `DateRangeBadge` se muestra entre el formulario y las stat cards

#### `FilterForm.tsx`

**Date picker:** usa `react-datepicker` (no MUI, sin Emotion).

| Período | Comportamiento                              |
| ------- | ------------------------------------------- |
| `day`   | Calendario estándar → `YYYY-MM-DD`          |
| `week`  | Cualquier día → snap al lunes de esa semana |
| `month` | `showMonthYearPicker` → `YYYY-MM-01`        |

Cambiar el período limpia la fecha seleccionada (usuario debe volver a seleccionar).

Los estilos del popup se inyectan vía `.mgs-datepicker` en `index.css` para compatibilidad con los temas dark/light.

**MultiSelectBox:** búsqueda, checkbox list, badge "X of Y", Select All / Deselect All.

#### `ReportChart.tsx`

Gráfico de barras apilado (Billable / Non-Billable) usando Chart.js 4 + react-chartjs-2.

- Colores: billable `#10b981`, non-billable `#8b5cf6`
- Labels del eje X formateados según el período (`formatDateLabel`)
- Recibe `chartRef` desde el padre para que el export pueda acceder a la instancia activa

#### `DetailsPanel.tsx`

Tabla de detalles con tres vistas de categoría y paginación.

**L1 — Category tabs:**

| Tab              | Sub-tabs                        | Columnas                                                     |
| ---------------- | ------------------------------- | ------------------------------------------------------------ |
| By Developer     | Un sub-tab por email único      | Date, Project, Component, Ticket, Hours, Billable            |
| By Project       | Un sub-tab por proyecto         | Date, Developer, Component, Ticket, Hours, Billable          |
| By Date/Interval | Depende del período (ver abajo) | Date, Developer, Project, Component, Ticket, Hours, Billable |

**"By Date/Interval" según período:**

- `day`: un sub-tab por fecha única
- `week`: un sub-tab por lunes de semana
- `month`: un sub-tab por semana (lun–dom) dentro del mes

**Paginación:**

- Tamaño de página: 10 / 25 / 50 (default 10)
- El estado `currentPage` y `pageSize` **persisten** al cambiar tabs
- Se clampea `currentPage` si el nuevo tab tiene menos páginas que la página actual
- Se resetea a 0 cuando cambia el prop `reportKey` (nueva generación de reporte)

#### `DownloadMenu.tsx`

Menú desplegable con dos opciones de exportación.

**Chart as HTML:**

- Lee el tema en tiempo de exportación (`data-theme` attribute)
- Extrae `chart.data.labels` + `datasets` del `chartRef` activo (refleja el tab visible)
- La línea de filtros muestra **nombres de proyecto** (derivados de `report.details`), no IDs numéricos
- Genera HTML standalone con Chart.js 4 vía CDN (`cdn.jsdelivr.net`)
- Contenedor `max-width: 1200px`, `height: 600px`, `maintainAspectRatio: false` — el gráfico ocupa todo el ancho disponible

**Data as Excel (.xlsx):**

- **Sheet "Details":** todas las filas (no paginadas), columnas: Date, Project, Component, Developer, Ticket Key, Hours, Billable. Sin `jiraWorklogId`.
- **Sheet "Summary":** agrupado por par (Project, Developer) — columnas: Project, Developer, Total Hours, Billable Hours, Non-Billable Hours. Ordenado por Project → Developer. Incluye fila de totales al final.
  - `Project` muestra siempre el **nombre** (e.g., "MgS"), no el ID numérico — el backend devuelve `w.component.project.name` directamente en `details[].project`.

---

## Dependencias añadidas

| Paquete                   | Scope               | Versión |
| ------------------------- | ------------------- | ------- |
| `react-datepicker`        | `apps/web`          | latest  |
| `@types/react-datepicker` | `apps/web` (devDep) | latest  |

---

## Estructura de archivos

```
apps/
  web/
    src/
      pages/
        CustomReports.tsx           # Página principal + DateRangeBadge
      components/
        reports/
          FilterForm.tsx            # Formulario con DatePicker
          ReportChart.tsx           # Gráfico Chart.js
          DetailsPanel.tsx          # Tabla con tabs y paginación  ← NUEVO
          DownloadMenu.tsx          # Export HTML + XLSX
      index.css                     # .mgs-datepicker overrides añadidos
  api/
    src/modules/reports/
      reports.controller.ts
      reports.service.ts
packages/
  shared/src/dto/
    custom-report.dto.ts            # DTOs compartidos
```
