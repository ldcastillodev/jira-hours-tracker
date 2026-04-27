import { useState, useRef, useMemo } from 'react';
import type { CustomReportDto, CustomReportDetailDto } from '@mgs/shared';
import type { Chart as ChartJS } from 'chart.js';
import { useApi } from '../hooks/useApi';
import { fetchApi } from '../services/api';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { FilterForm } from '../components/reports/FilterForm';
import { ReportChart } from '../components/reports/ReportChart';
import { DownloadMenu } from '../components/reports/DownloadMenu';
import type { FilterValues } from '../components/reports/FilterForm';
import type { CustomReportTimelineEntryDto } from '@mgs/shared';

interface Project {
  id: number;
  name: string;
}

interface Developer {
  id: number;
  name: string;
  email: string;
}

/** Re-bucket a details slice into a timeline keyed by date */
function buildTimeline(
  details: CustomReportDetailDto[],
  allDates: string[],
): CustomReportTimelineEntryDto[] {
  const buckets = new Map<string, { billable: number; nonBillable: number }>();
  for (const d of allDates) buckets.set(d, { billable: 0, nonBillable: 0 });
  for (const d of details) {
    const b = buckets.get(d.date) ?? { billable: 0, nonBillable: 0 };
    if (d.billable) b.billable += d.hours;
    else b.nonBillable += d.hours;
    buckets.set(d.date, b);
  }
  return Array.from(buckets.entries()).map(([date, b]) => ({
    date,
    billableHours: Math.round(b.billable * 100) / 100,
    nonBillableHours: Math.round(b.nonBillable * 100) / 100,
  }));
}

function sliceSummary(details: CustomReportDetailDto[]) {
  const billable = details.filter((d) => d.billable).reduce((s, d) => s + d.hours, 0);
  const nonBillable = details.filter((d) => !d.billable).reduce((s, d) => s + d.hours, 0);
  return {
    billable: Math.round(billable * 100) / 100,
    nonBillable: Math.round(nonBillable * 100) / 100,
    total: Math.round((billable + nonBillable) * 100) / 100,
  };
}

export function CustomReports() {
  const { data: projects } = useApi<Project[]>('/projects');
  const { data: developers } = useApi<Developer[]>('/developers');

  const [report, setReport] = useState<CustomReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<FilterValues | null>(null);

  // Tab state
  const [activeDevTab, setActiveDevTab] = useState<string>('__all__');
  const [activeProjTab, setActiveProjTab] = useState<string>('__all__');

  // Active chart ref — updated by the currently visible ReportChart
  const activeChartRef = useRef<ChartJS<'bar'> | null>(null);

  async function handleGenerate(values: FilterValues) {
    setLoading(true);
    setError(null);
    setLastFilters(values);
    setActiveDevTab('__all__');
    setActiveProjTab('__all__');

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

  // Derive unique developer emails and project names from details
  const devEmails = useMemo(() => {
    if (!report) return [];
    return [...new Set(report.details.map((d) => d.developer))];
  }, [report]);

  const allDates = useMemo(() => {
    if (!report) return [];
    return report.timeline.map((t) => t.date);
  }, [report]);

  // Filtered details for the active dev tab
  const devDetails = useMemo(() => {
    if (!report) return [];
    return activeDevTab === '__all__'
      ? report.details
      : report.details.filter((d) => d.developer === activeDevTab);
  }, [report, activeDevTab]);

  // Project names within active dev slice
  const projNames = useMemo(
    () => [...new Set(devDetails.map((d) => d.project))],
    [devDetails],
  );

  // Filtered details for the active proj tab (within the active dev slice)
  const sliceDetails = useMemo(() => {
    return activeProjTab === '__all__'
      ? devDetails
      : devDetails.filter((d) => d.project === activeProjTab);
  }, [devDetails, activeProjTab]);

  const sliceTimeline = useMemo(
    () => buildTimeline(sliceDetails, allDates),
    [sliceDetails, allDates],
  );

  const sliceSummaryData = useMemo(() => sliceSummary(sliceDetails), [sliceDetails]);

  // Dev name lookup
  const devNameMap = useMemo(() => {
    const map = new Map<string, string>();
    developers?.forEach((d) => map.set(d.email, d.name));
    return map;
  }, [developers]);

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
            <span className="animate-pulse font-mono text-sm text-mgs-text-dim">Generating report…</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-mgs-red/30 bg-mgs-red/10 p-6 text-center text-sm text-mgs-red-light">
            {error}
          </div>
        )}

        {!loading && report && (
          <>
            {/* Global summary stats */}
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

            {/* Tabbed chart view */}
            <div className="rounded-xl border border-mgs-border bg-mgs-card">
              {/* L1 — Developer tabs */}
              <div className="border-b border-mgs-border px-4 pt-4">
                <TabBar>
                  <Tab
                    active={activeDevTab === '__all__'}
                    onClick={() => { setActiveDevTab('__all__'); setActiveProjTab('__all__'); }}
                  >
                    All Developers
                  </Tab>
                  {devEmails.map((email) => (
                    <Tab
                      key={email}
                      active={activeDevTab === email}
                      onClick={() => { setActiveDevTab(email); setActiveProjTab('__all__'); }}
                    >
                      {devNameMap.get(email) ?? email}
                    </Tab>
                  ))}
                </TabBar>
              </div>

              {/* L2 — Project tabs */}
              {projNames.length > 1 && (
                <div className="border-b border-mgs-border bg-mgs-card-alt px-4 pt-3">
                  <TabBar secondary>
                    <Tab
                      active={activeProjTab === '__all__'}
                      onClick={() => setActiveProjTab('__all__')}
                      secondary
                    >
                      All Projects
                    </Tab>
                    {projNames.map((proj) => (
                      <Tab
                        key={proj}
                        active={activeProjTab === proj}
                        onClick={() => setActiveProjTab(proj)}
                        secondary
                      >
                        {proj}
                      </Tab>
                    ))}
                  </TabBar>
                </div>
              )}

              {/* Chart area */}
              <div className="p-5">
                {sliceDetails.length === 0 ? (
                  <div className="py-12 text-center text-sm text-mgs-text-dim">
                    No data for this selection.
                  </div>
                ) : (
                  <>
                    <ReportChart
                      timeline={sliceTimeline}
                      period={report.period}
                      chartRef={activeChartRef}
                    />
                    {/* Per-slice summary */}
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-mgs-text-muted">
                      <span>
                        <span className="font-semibold text-mgs-text">{sliceSummaryData.total.toFixed(1)}h</span> total
                      </span>
                      <span>
                        <span className="font-semibold" style={{ color: '#10b981' }}>{sliceSummaryData.billable.toFixed(1)}h</span> billable
                      </span>
                      <span>
                        <span className="font-semibold" style={{ color: '#8b5cf6' }}>{sliceSummaryData.nonBillable.toFixed(1)}h</span> non-billable
                      </span>
                      <span>{sliceDetails.length} entries</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Download */}
            <div className="flex justify-end">
              <DownloadMenu report={report} chartRef={activeChartRef} />
            </div>

            {/* Details table */}
            {report.details.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-mgs-border bg-mgs-card-alt">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-mgs-border">
                      {['Date', 'Developer', 'Project', 'Component', 'Ticket', 'Hours', 'Billable'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {report.details.map((d, i) => (
                      <tr key={i} className="border-b border-mgs-border/50 last:border-0">
                        <td className="px-4 py-2.5 font-mono text-mgs-text-dim">{d.date}</td>
                        <td className="px-4 py-2.5 text-mgs-text-muted">{devNameMap.get(d.developer) ?? d.developer}</td>
                        <td className="px-4 py-2.5 text-mgs-text-muted">{d.project}</td>
                        <td className="px-4 py-2.5 text-mgs-text-muted">{d.component}</td>
                        <td className="px-4 py-2.5 font-mono text-mgs-text-dim">{d.ticketKey}</td>
                        <td className="px-4 py-2.5 font-mono text-mgs-text">{d.hours.toFixed(1)}h</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-[20px] px-2 py-0.5 text-[10px] font-medium ${
                              d.billable
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-purple-500/10 text-purple-400'
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

function TabBar({
  children,
  secondary,
}: {
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-1 ${secondary ? 'pb-2' : 'pb-0'}` }>
      {children}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
  secondary,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  if (secondary) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
          active
            ? 'bg-mgs-border text-mgs-text'
            : 'text-mgs-text-dim hover:text-mgs-text-muted'
        }`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px rounded-t-lg border-b-2 px-3.5 py-2 text-xs font-medium transition-colors ${
        active
          ? 'border-mgs-blue text-mgs-blue'
          : 'border-transparent text-mgs-text-dim hover:text-mgs-text-muted'
      }`}
    >
      {children}
    </button>
  );
}
