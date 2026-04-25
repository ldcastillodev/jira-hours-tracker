import type { ClientHoursSummaryDto } from '@mgs/shared';
import { useApi } from '../hooks/useApi';
import { useMonth } from '../hooks/useMonth';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { ClientHoursChart } from '../components/charts/ClientHoursChart';
import { ClientTable } from '../components/ui/ClientTable';
import {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '../components/ui/Skeleton';

export function Dashboard() {
  const { month, label: monthLabel, dateStr } = useMonth();
  const { data, loading, error } = useApi<ClientHoursSummaryDto>(
    `/reports/client-hours?month=${month}`,
  );

  if (error) {
    return (
      <>
        <Header
          title="MgS — Client Hours Report"
          subtitle={`Sheet: clientHours · Datos al ${dateStr}`}
          badge={monthLabel}
        />
        <div className="rounded-xl border border-mgs-red/30 bg-mgs-red/10 p-6 text-center text-sm text-mgs-red-light">
          Error loading data: {error}
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="MgS — Client Hours Report"
        subtitle={`Sheet: clientHours · Datos al ${dateStr}`}
        badge={monthLabel}
      />

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Contratadas"
              value={data!.totalContracted.toLocaleString()}
              unit="h"
              sub="todas las cuentas"
              color="#3b82f6"
            />
            <StatCard
              label="Horas Usadas"
              value={data!.totalUsed.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
              unit="h"
              sub={`${((data!.totalUsed / data!.totalContracted) * 100).toFixed(2)}% del total`}
              color="#10b981"
            />
            <StatCard
              label="Horas Restantes"
              value={data!.totalRemaining.toLocaleString(undefined, {
                minimumFractionDigits: 1,
              })}
              unit="h"
              sub="clientes dentro presupuesto"
              color="#8b5cf6"
            />
            <StatCard
              label="Clientes Excedidos"
              value={String(data!.overBudgetCount)}
              sub="necesitan revisión"
              color="#ef4444"
              alert={data!.overBudgetCount > 0 ? 'REVISAR' : undefined}
            />
          </>
        )}
      </div>

      {/* Chart */}
      <div className="mb-7">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ClientHoursChart clients={data!.clients} />
        )}
      </div>

      {/* Table */}
      {loading ? <TableSkeleton /> : <ClientTable clients={data!.clients} />}
    </>
  );
}
