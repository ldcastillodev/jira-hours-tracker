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
    const imgSrc = chart ? chart.toBase64Image() : '';

    const filterLines = [
      report.filters.projectIds.length > 0
        ? `Projects: ${report.filters.projectIds.join(', ')}`
        : null,
      report.filters.developerEmails.length > 0
        ? `Developers: ${report.filters.developerEmails.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('<br>');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0d1117; color: #e2e8f0; padding: 40px; }
    h1 { font-family: monospace; font-size: 18px; margin-bottom: 8px; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; line-height: 1.8; }
    img { max-width: 100%; border: 1px solid #1e293b; border-radius: 12px; }
  </style>
</head>
<body>
  <h1>Custom Report — ${report.period.toUpperCase()}</h1>
  <div class="meta">
    Date range: ${report.startDate} → ${report.endDate}<br>
    ${filterLines || 'No filters applied'}<br>
    Total: ${report.summary.totalHours}h &nbsp;|&nbsp;
    Billable: ${report.summary.billableHours}h &nbsp;|&nbsp;
    Non-Billable: ${report.summary.nonBillableHours}h<br>
    Generated: ${new Date().toISOString()}
  </div>
  ${imgSrc ? `<img src="${imgSrc}" alt="Report chart" />` : '<p>Chart not available</p>'}
</body>
</html>`;

    triggerDownload(`${filename}.html`, html, 'text/html');
    setOpen(false);
  }

  function downloadXlsx() {
    const wb = XLSX.utils.book_new();

    // Details sheet
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
    const detailsSheet = XLSX.utils.json_to_sheet(detailsRows);
    XLSX.utils.book_append_sheet(wb, detailsSheet, 'Details');

    // Summary sheet
    const summaryRows = [
      { Metric: 'Period', Value: report.period },
      { Metric: 'Start Date', Value: report.startDate },
      { Metric: 'End Date', Value: report.endDate },
      { Metric: 'Total Hours', Value: report.summary.totalHours },
      { Metric: 'Billable Hours', Value: report.summary.billableHours },
      { Metric: 'Non-Billable Hours', Value: report.summary.nonBillableHours },
      { Metric: 'Worklog Entries', Value: report.summary.worklogs },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

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
          <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-mgs-border bg-mgs-card shadow-2xl">
            <button
              onClick={downloadChartHtml}
              className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-mgs-card-alt"
            >
              <span className="mt-0.5 text-mgs-blue">◻</span>
              <div>
                <div className="text-xs font-medium text-mgs-text">Chart as HTML</div>
                <div className="text-[10px] text-mgs-text-dim">Standalone browser file</div>
              </div>
            </button>
            <div className="border-t border-mgs-border" />
            <button
              onClick={downloadXlsx}
              className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-mgs-card-alt"
            >
              <span className="mt-0.5 text-mgs-green">⊞</span>
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
