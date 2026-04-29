import type { ClientHoursSummaryDto } from '@mgs/shared';
import { useApi, useDataRefresh } from '../../../hooks/useApi';
import { useMonth } from '../../../hooks/useMonth';
import { Header } from '../../atoms/Header/Header';
import { StatCard } from '../../atoms/StatCard/StatCard';
import { Alert } from '../../atoms/Alert/Alert';
import { ClientHoursChart } from '../../organisms/ClientHoursChart/ClientHoursChart';
import { ClientTable } from '../../organisms/ClientTable/ClientTable';
import {
  StatCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '../../atoms/Skeleton/Skeleton';

export function Dashboard() {
  const { month, label: monthLabel } = useMonth();
  const { data, loading, error, refetch } = useApi<ClientHoursSummaryDto>(
    `/reports/client-hours?month=${month}`,
  );
  useDataRefresh(refetch);

  if (error) {
    return (
      <>
        <Header
          title="MgS — Project Hours Report"
          subtitle={`See the full monthly breakdown of hours spent per project.`}
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
        title="MgS — Project Hours Report"
        subtitle={`See the full monthly breakdown of hours spent per project.`}
        badge={monthLabel}
      />

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            {(() => {
              const nearBudget = data!.clients.filter(
                (c) => c.isBillable && c.percentUsed >= 75 && c.percentUsed < 100,
              );
              const nearBudgetSub =
                nearBudget.length === 0
                  ? 'all projects within budget'
                  : nearBudget
                      .map((c) => `${c.projectName} ${c.percentUsed.toFixed(0)}%`)
                      .join(', ');
              const overBudget = data!.clients.filter(
                (c) => c.isBillable && c.remaining < 0,
              );
              const overBudgetSub =
                overBudget.length === 0
                  ? 'all projects within budget'
                  : overBudget
                      .map((c) => `${c.projectName} ${c.percentUsed.toFixed(0)}%`)
                      .join(', ');
              return (
                <>
                  <StatCard
                    label="Total Contracted"
                    value={data!.totalContracted.toLocaleString()}
                    unit="h"
                    sub="all projects"
                    color="#3b82f6"
                  />
                  <StatCard
                    label="Hours Used"
                    value={data!.totalUsed.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                    unit="h"
                    sub={`${data!.totalContracted > 0 ? ((data!.totalUsed / data!.totalContracted) * 100).toFixed(2) : '—'}% of total`}
                    color="#10b981"
                  />
                  <StatCard
                    label="Remaining Hours"
                    value={data!.totalRemaining.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                    })}
                    unit="h"
                    sub="projects within budget"
                    color="#8b5cf6"
                  />
                  <StatCard
                    label="Near Limit"
                    value={String(nearBudget.length)}
                    sub={nearBudgetSub}
                    color="#f59e0b"
                    alert={nearBudget.length > 0 ? 'WARNING' : undefined}
                    alertColor="#f59e0b"
                  />
                  <StatCard
                    label="Over-Budget Projects"
                    value={String(data!.overBudgetCount)}
                    sub={overBudgetSub}
                    color="#ef4444"
                    alert={data!.overBudgetCount > 0 ? 'REVIEW' : undefined}
                  />
                </>
              );
            })()}
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
