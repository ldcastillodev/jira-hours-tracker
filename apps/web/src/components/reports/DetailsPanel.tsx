import { useState, useMemo, useEffect } from 'react';
import type { CustomReportDetailDto } from '@mgs/shared';

type Period = 'day' | 'week' | 'month';
type CategoryTab = 'developer' | 'project' | 'interval';

interface DetailsPanelProps {
  details: CustomReportDetailDto[];
  period: Period;
  devNameMap: Map<string, string>;
  reportKey: string;
}

/** Snap a YYYY-MM-DD date to its Monday (Mon–Sun week) */
function toMondayStr(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = d.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function fmtDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function fmtWeekLabel(mondayStr: string): string {
  return `Week of ${fmtDate(mondayStr)}`;
}

const PAGE_SIZES = [10, 25, 50] as const;

export function DetailsPanel({ details, period, devNameMap, reportKey }: DetailsPanelProps) {
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('developer');
  const [subTab, setSubTab] = useState<string>('__first__');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(0);

  // Reset pagination on new report
  useEffect(() => {
    setCurrentPage(0);
  }, [reportKey]);

  // --- Sub-tab keys per category ---
  const developerKeys = useMemo(
    () => [...new Set(details.map((d) => d.developer))].sort(),
    [details],
  );

  const projectKeys = useMemo(
    () => [...new Set(details.map((d) => d.project))].sort(),
    [details],
  );

  const intervalKeys = useMemo(() => {
    if (period === 'day') {
      return [...new Set(details.map((d) => d.date))].sort();
    }
    // week or month: group by Mon–Sun week
    return [...new Set(details.map((d) => toMondayStr(d.date)))].sort();
  }, [details, period]);

  // Active sub-tab keys
  const subTabKeys = categoryTab === 'developer' ? developerKeys
    : categoryTab === 'project' ? projectKeys
    : intervalKeys;

  // Resolve active sub-tab (default to first key)
  const activeSubTab = subTabKeys.includes(subTab) ? subTab : subTabKeys[0] ?? '';

  // Filter details for active (category, subTab)
  const filtered = useMemo(() => {
    if (!activeSubTab) return [];

    let rows: CustomReportDetailDto[];

    if (categoryTab === 'developer') {
      rows = details.filter((d) => d.developer === activeSubTab);
    } else if (categoryTab === 'project') {
      rows = details.filter((d) => d.project === activeSubTab);
    } else {
      // interval
      if (period === 'day') {
        rows = details.filter((d) => d.date === activeSubTab);
      } else {
        rows = details.filter((d) => toMondayStr(d.date) === activeSubTab);
      }
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date));
  }, [details, categoryTab, activeSubTab, period]);

  // Columns per category
  const columns: { key: string; header: string; render: (d: CustomReportDetailDto) => React.ReactNode }[] = useMemo(() => {
    const date = { key: 'date', header: 'Date', render: (d: CustomReportDetailDto) => <span className="font-mono text-mgs-text-dim">{d.date}</span> };
    const developer = { key: 'developer', header: 'Developer', render: (d: CustomReportDetailDto) => <span className="text-mgs-text-muted">{devNameMap.get(d.developer) ?? d.developer}</span> };
    const project = { key: 'project', header: 'Project', render: (d: CustomReportDetailDto) => <span className="text-mgs-text-muted">{d.project}</span> };
    const component = { key: 'component', header: 'Component', render: (d: CustomReportDetailDto) => <span className="text-mgs-text-muted">{d.component}</span> };
    const ticket = { key: 'ticket', header: 'Ticket', render: (d: CustomReportDetailDto) => <span className="font-mono text-mgs-text-dim">{d.ticketKey}</span> };
    const hours = { key: 'hours', header: 'Hours', render: (d: CustomReportDetailDto) => <span className="font-mono text-mgs-text">{d.hours.toFixed(1)}h</span> };
    const billable = {
      key: 'billable',
      header: 'Billable',
      render: (d: CustomReportDetailDto) => (
        <span className={`rounded-[20px] px-2 py-0.5 text-[10px] font-medium ${d.billable ? 'bg-green-500/10 text-green-400' : 'bg-purple-500/10 text-purple-400'}`}>
          {d.billable ? 'Yes' : 'No'}
        </span>
      ),
    };

    if (categoryTab === 'developer') return [date, project, component, ticket, hours, billable];
    if (categoryTab === 'project') return [date, developer, component, ticket, hours, billable];
    return [date, developer, project, component, ticket, hours, billable];
  }, [categoryTab, devNameMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages - 1);
  const pageRows = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const rangeEnd = Math.min((safePage + 1) * pageSize, filtered.length);

  // Sync safePage if clamped
  useEffect(() => {
    if (safePage !== currentPage) setCurrentPage(safePage);
  }, [safePage, currentPage]);

  function subTabLabel(key: string): string {
    if (categoryTab === 'developer') return devNameMap.get(key) ?? key;
    if (categoryTab === 'project') return key;
    // interval
    if (period === 'day') return fmtDate(key);
    return fmtWeekLabel(key);
  }

  if (details.length === 0) return null;

  return (
    <div className="rounded-xl border border-mgs-border bg-mgs-card-alt">
      {/* L1 — Category tabs */}
      <div className="border-b border-mgs-border px-4 pt-4">
        <div className="flex flex-wrap gap-1 pb-0">
          {([
            ['developer', 'By Developer'],
            ['project', 'By Project'],
            ['interval', period === 'day' ? 'By Date' : period === 'week' ? 'By Week' : 'By Week'],
          ] as [CategoryTab, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setCategoryTab(key); setSubTab('__first__'); }}
              className={`-mb-px rounded-t-lg border-b-2 px-3.5 py-2 text-xs font-medium transition-colors ${
                categoryTab === key
                  ? 'border-mgs-blue text-mgs-blue'
                  : 'border-transparent text-mgs-text-dim hover:text-mgs-text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* L2 — Sub-tabs */}
      {subTabKeys.length > 0 && (
        <div className="border-b border-mgs-border bg-mgs-card px-4 pt-3">
          <div className="flex flex-wrap gap-1 pb-2">
            {subTabKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSubTab(key)}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activeSubTab === key
                    ? 'bg-mgs-border text-mgs-text'
                    : 'text-mgs-text-dim hover:text-mgs-text-muted'
                }`}
              >
                {subTabLabel(key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-mgs-text-dim">No data for this selection.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-mgs-border">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((d, i) => (
                <tr key={i} className="border-b border-mgs-border/50 last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5">{col.render(d)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mgs-border px-4 py-3">
          <span className="text-[11px] text-mgs-text-dim">
            Showing {rangeStart}–{rangeEnd} of {filtered.length} entries
          </span>

          <div className="flex items-center gap-3">
            {/* Page size selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-mgs-text-dim">Rows:</span>
              {PAGE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => { setPageSize(size); setCurrentPage(0); }}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    pageSize === size
                      ? 'bg-mgs-border text-mgs-text'
                      : 'text-mgs-text-dim hover:text-mgs-text-muted'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Prev / Page / Next */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="rounded px-2 py-0.5 text-[11px] text-mgs-text-dim transition-colors hover:text-mgs-text disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="px-1.5 text-[11px] text-mgs-text-muted">
                {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                className="rounded px-2 py-0.5 text-[11px] text-mgs-text-dim transition-colors hover:text-mgs-text disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
