import type { MonthReportDto } from '@mgs/shared';
import { useApi, useDataRefresh } from '../../../hooks/useApi';
import { useMonth } from '../../../hooks/useMonth';
import { Header } from '../../atoms/Header/Header';
import { StatCard } from '../../atoms/StatCard/StatCard';
import { Alert } from '../../atoms/Alert/Alert';
import { DeveloperWorkloadChart } from '../../organisms/DeveloperWorkloadChart/DeveloperWorkloadChart';
import { DeveloperTable } from '../../organisms/DeveloperTable/DeveloperTable';
import {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '../../atoms/Skeleton/Skeleton';

export function DeveloperReport() {
  const { month, label: monthLabel } = useMonth();
  const { data, loading, error, refetch } = useApi<MonthReportDto>(
    `/reports/developer-workload?month=${month}`,
  );
  useDataRefresh(refetch);

  if (error) {
    return (
      <>
        <Header
          title="MgS — Developer Workload"
          subtitle={`See the full monthly breakdown of hours spent per developer.`}
          badge={monthLabel}
        />
        <Alert variant="page">
          Error loading data: {error}
        </Alert>
      </>
    );
  }

  return (
    <>
      <Header
        title="MgS — Developer Workload"
        subtitle={`See the full monthly breakdown of hours spent per developer.`}
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
