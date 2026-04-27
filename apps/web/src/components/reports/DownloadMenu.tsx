import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { CustomReportDto } from '@mgs/shared';
import type { Chart as ChartJS } from 'chart.js';

interface DownloadMenuProps {
  report: CustomReportDto;
  chartRef: React.RefObject<ChartJS<'bar'> | null>;
}

export function DownloadMenu({ report, chartRef }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);

  const filename = `custom-report-${report.period}-${report.startDate}-${report.endDate}`;

  function downloadChartHtml() {
    const chart = chartRef.current;

    // Read theme at export time
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const bg = isDark ? '#0d1117' : '#ffffff';
    const cardBg = isDark ? '#131b2e' : '#f8fafc';
    const border = isDark ? '#1e293b' : '#e2e8f0';
    const textColor = isDark ? '#e2e8f0' : '#0f172a';
    const mutedColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#1e293b' : '#e2e8f0';
    const tickColor = isDark ? '#475569' : '#94a3b8';
    const tooltipBg = isDark ? '#131b2e' : '#ffffff';

    // Extract chart data from the live chart instance (reflects active tab)
    const chartData = chart
      ? {
          labels: chart.data.labels as string[],
          datasets: chart.data.datasets.map((ds) => ({
            label: ds.label,
            data: ds.data,
            backgroundColor: (ds as { backgroundColor?: string }).backgroundColor ?? '#3b82f6',
            borderRadius: 4,
          })),
        }
      : { labels: [], datasets: [] };

    const filterLines = [
      report.filters.developerEmails.length > 0
        ? `Developers: ${report.filters.developerEmails.join(', ')}`
        : null,
      report.filters.projectIds.length > 0
        ? `Projects: ${report.filters.projectIds.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join(' &nbsp;·&nbsp; ');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${filename}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: ${bg}; color: ${textColor}; padding: 40px; }
    h1 { font-family: monospace; font-size: 18px; font-weight: 700; margin: 0 0 6px; }
    .meta { font-size: 12px; color: ${mutedColor}; margin-bottom: 28px; line-height: 1.9; }
    .card { background: ${cardBg}; border: 1px solid ${border}; border-radius: 12px; padding: 24px; }
    .legend { display: flex; gap: 16px; margin-bottom: 16px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: ${mutedColor}; }
    .legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    canvas { width: 100% !important; }
    .footer { margin-top: 16px; font-size: 11px; color: ${mutedColor}; }
  </style>
</head>
<body>
  <h1>Custom Report — ${report.period.toUpperCase()}</h1>
  <div class="meta">
    <strong>${report.startDate}</strong> → <strong>${report.endDate}</strong><br>
    ${filterLines || 'No filters applied'}<br>
    Total: <strong>${report.summary.totalHours}h</strong> &nbsp;·&nbsp;
    Billable: <strong>${report.summary.billableHours}h</strong> &nbsp;·&nbsp;
    Non-Billable: <strong>${report.summary.nonBillableHours}h</strong>
  </div>
  <div class="card">
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div> Billable</div>
      <div class="legend-item"><div class="legend-dot" style="background:#8b5cf6"></div> Non-Billable</div>
    </div>
    <canvas id="chart" height="320"></canvas>
  </div>
  <div class="footer">Generated ${new Date().toLocaleString()}</div>
  <script>
    new Chart(document.getElementById('chart'), {
      type: 'bar',
      data: ${JSON.stringify(chartData)},
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '${tooltipBg}',
            borderColor: '${border}',
            borderWidth: 1,
            titleColor: '${textColor}',
            bodyColor: '${mutedColor}',
            padding: 10,
          },
        },
        scales: {
          x: { stacked: true, grid: { color: '${gridColor}' }, ticks: { color: '${tickColor}', font: { size: 10 } } },
          y: { stacked: true, grid: { color: '${gridColor}' }, ticks: { color: '${tickColor}', font: { size: 10 }, callback: (v) => v + 'h' } },
        },
      },
    });
  <\/script>
</body>
</html>`;

    triggerDownload(`${filename}.html`, html, 'text/html');
    setOpen(false);
  }

  function downloadXlsx() {
    const wb = XLSX.utils.book_new();

    const detailsRows = report.details.map((d) => ({
      Date: d.date,
      Project: d.project,
      Component: d.component,
      Developer: d.developer,
      'Ticket Key': d.ticketKey,
      'Jira Worklog ID': d.jiraWorklogId,
      Hours: d.hours,
      Billable: d.billable ? 'Yes' : 'No',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailsRows), 'Details');

    const summaryRows = [
      { Metric: 'Period', Value: report.period },
      { Metric: 'Start Date', Value: report.startDate },
      { Metric: 'End Date', Value: report.endDate },
      { Metric: 'Total Hours', Value: report.summary.totalHours },
      { Metric: 'Billable Hours', Value: report.summary.billableHours },
      { Metric: 'Non-Billable Hours', Value: report.summary.nonBillableHours },
      { Metric: 'Worklog Entries', Value: report.summary.worklogs },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

    XLSX.writeFile(wb, `${filename}.xlsx`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-mgs-border bg-mgs-card px-3 py-1.5 text-xs font-medium text-mgs-text-muted transition-colors hover:text-mgs-text"
      >
        Download
        <span className="text-mgs-text-dim">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-mgs-border bg-mgs-card shadow-2xl">
            <button
              onClick={downloadChartHtml}
              className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-mgs-card-alt"
            >
              <span className="mt-0.5 text-mgs-blue">◻</span>
              <div>
                <div className="text-xs font-medium text-mgs-text">Chart as HTML</div>
                <div className="text-[10px] text-mgs-text-dim">Interactive · inherits current theme</div>
              </div>
            </button>
            <div className="border-t border-mgs-border" />
            <button
              onClick={downloadXlsx}
              className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-mgs-card-alt"
            >
              <span className="mt-0.5 text-green-400">⊞</span>
              <div>
                <div className="text-xs font-medium text-mgs-text">Data as Excel (.xlsx)</div>
                <div className="text-[10px] text-mgs-text-dim">Details + Summary sheets</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

