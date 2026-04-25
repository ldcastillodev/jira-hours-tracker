import type { MonthReportDto } from '@mgs/shared';
import { useApi } from '../hooks/useApi';
import { useMonth } from '../hooks/useMonth';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { DeveloperWorkloadChart } from '../components/charts/DeveloperWorkloadChart';
import { DeveloperTable } from '../components/ui/DeveloperTable';
import {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '../components/ui/Skeleton';

export function DeveloperReport() {
  const { month, label: monthLabel, dateStr } = useMonth();
  const { data, loading, error } = useApi<MonthReportDto>(
    `/reports/developer-workload?month=${month}`,
  );

  if (error) {
    return (
      <>
        <Header
          title="MgS — Developer Workload"
          subtitle={`MonthReport · Datos al ${dateStr}`}
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
        title="MgS — Developer Workload"
        subtitle={`MonthReport · Datos al ${dateStr}`}
        badge={monthLabel}
      />

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Hours"
              value={data!.totalHours.toLocaleString(undefined, {
                minimumFractionDigits: 1,
              })}
              unit="h"
              sub="all developers"
              color="#3b82f6"
            />
            <StatCard
              label="Billable"
              value={data!.totalBillable.toLocaleString(undefined, {
                minimumFractionDigits: 1,
              })}
              unit="h"
              sub={
                data!.totalHours > 0
                  ? `${((data!.totalBillable / data!.totalHours) * 100).toFixed(1)}% of total`
                  : '0% of total'
              }
              color="#10b981"
            />
            <StatCard
              label="Non-Billable"
              value={data!.totalNonBillable.toLocaleString(undefined, {
                minimumFractionDigits: 1,
              })}
              unit="h"
              sub={
                data!.totalHours > 0
                  ? `${((data!.totalNonBillable / data!.totalHours) * 100).toFixed(1)}% of total`
                  : '0% of total'
              }
              color="#8b5cf6"
            />
            <StatCard
              label="Developers"
              value={String(data!.developers.length)}
              sub="active this month"
              color="#f59e0b"
            />
          </>
        )}
      </div>

      {/* Chart */}
      <div className="mb-7">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <DeveloperWorkloadChart developers={data!.developers} />
        )}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <DeveloperTable developers={data!.developers} />
      )}
    </>
  );
}
