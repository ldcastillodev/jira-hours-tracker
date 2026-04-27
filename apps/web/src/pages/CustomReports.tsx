import { useState, useRef } from 'react';
import type { CustomReportDto } from '@mgs/shared';
import type { Chart as ChartJS } from 'chart.js';
import { useApi } from '../hooks/useApi';
import { fetchApi } from '../services/api';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { FilterForm } from '../components/reports/FilterForm';
import { ReportChart } from '../components/reports/ReportChart';
import { DownloadMenu } from '../components/reports/DownloadMenu';
import type { FilterValues } from '../components/reports/FilterForm';

interface Project {
  id: number;
  name: string;
}

interface Developer {
  id: number;
  name: string;
  email: string;
}

export function CustomReports() {
  const { data: projects } = useApi<Project[]>('/projects');
  const { data: developers } = useApi<Developer[]>('/developers');

  const [report, setReport] = useState<CustomReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<FilterValues | null>(null);

  const chartRef = useRef<ChartJS<'bar'> | null>(null);

  async function handleGenerate(values: FilterValues) {
    setLoading(true);
    setError(null);
    setLastFilters(values);

    const params = new URLSearchParams({ period: values.period, startDate: values.startDate });
    if (values.projectIds.length > 0) params.set('projectIds', values.projectIds.join(','));
    if (values.developerEmails.length > 0) params.set('developerEmails', values.developerEmails.join(','));

    try {
      const data = await fetchApi<CustomReportDto>(`/reports/custom?${params}`);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  const badge = lastFilters
    ? `${lastFilters.period} · ${lastFilters.startDate}`
    : 'Custom';

  return (
    <>
      <Header
        title="MgS — Custom Reports"
        subtitle="Filter by period, project, and developer"
        badge={badge}
      />

      <div className="space-y-6">
        <FilterForm
          projects={projects ?? []}
          developers={developers ?? []}
          onSubmit={handleGenerate}
          loading={loading}
        />

        {loading && (
          <div className="flex items-center justify-center rounded-xl border border-mgs-border bg-mgs-card-alt py-16">
            <span className="font-mono text-sm text-mgs-text-dim animate-pulse">Generating report…</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-mgs-red/30 bg-mgs-red/10 p-6 text-center text-sm text-mgs-red-light">
            {error}
          </div>
        )}

        {!loading && report && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Total Hours"
                value={report.summary.totalHours.toFixed(1)}
                unit="h"
                sub={`${report.summary.worklogs} worklog entries`}
                color="#3b82f6"
              />
              <StatCard
                label="Billable"
                value={report.summary.billableHours.toFixed(1)}
                unit="h"
                sub={
                  report.summary.totalHours > 0
                    ? `${((report.summary.billableHours / report.summary.totalHours) * 100).toFixed(1)}% of total`
                    : '0% of total'
                }
                color="#10b981"
              />
              <StatCard
                label="Non-Billable"
                value={report.summary.nonBillableHours.toFixed(1)}
                unit="h"
                sub={
                  report.summary.totalHours > 0
                    ? `${((report.summary.nonBillableHours / report.summary.totalHours) * 100).toFixed(1)}% of total`
                    : '0% of total'
                }
                color="#8b5cf6"
              />
              <StatCard
                label="Date Range"
                value={report.endDate.slice(5)}
                sub={`${report.startDate} → ${report.endDate}`}
                color="#f59e0b"
              />
            </div>

            {/* Chart */}
            {report.timeline.length > 0 ? (
              <ReportChart timeline={report.timeline} period={report.period} chartRef={chartRef} />
            ) : (
              <div className="rounded-xl border border-mgs-border bg-mgs-card-alt py-12 text-center text-sm text-mgs-text-dim">
                No worklogs found for this period and filters.
              </div>
            )}

            {/* Download */}
            <div className="flex justify-end">
              <DownloadMenu report={report} chartRef={chartRef} />
            </div>

            {/* Details table */}
            {report.details.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-mgs-border bg-mgs-card-alt">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-mgs-border">
                      {['Date', 'Developer', 'Project', 'Component', 'Ticket', 'Hours', 'Billable'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.details.map((d, i) => (
                      <tr key={i} className="border-b border-mgs-border/50 last:border-0">
                        <td className="px-4 py-2.5 font-mono text-mgs-text-dim">{d.date}</td>
                        <td className="px-4 py-2.5 text-mgs-text-muted">{d.developer}</td>
                        <td className="px-4 py-2.5 text-mgs-text-muted">{d.project}</td>
                        <td className="px-4 py-2.5 text-mgs-text-muted">{d.component}</td>
                        <td className="px-4 py-2.5 font-mono text-mgs-text-dim">{d.ticketKey}</td>
                        <td className="px-4 py-2.5 font-mono text-mgs-text">{d.hours.toFixed(1)}h</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-[20px] px-2 py-0.5 text-[10px] font-medium ${
                              d.billable
                                ? 'bg-mgs-green/10 text-mgs-green'
                                : 'bg-mgs-purple/10 text-mgs-purple'
                            }`}
                          >
                            {d.billable ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
