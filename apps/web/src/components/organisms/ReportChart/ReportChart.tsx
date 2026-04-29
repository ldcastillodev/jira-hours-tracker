import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { CustomReportTimelineEntryDto } from '@mgs/shared';
import { LegendItem } from '../../atoms/LegendItem/LegendItem';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ReportChartProps {
  timeline: CustomReportTimelineEntryDto[];
  period: 'day' | 'week' | 'month';
  chartRef?: React.RefObject<ChartJS<'bar'> | null>;
}

function formatDateLabel(dateStr: string, period: 'day' | 'week' | 'month'): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (period === 'month') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  if (period === 'week') {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
  // day
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function ReportChart({ timeline, period, chartRef }: ReportChartProps) {
  const data = {
    labels: timeline.map((t) => formatDateLabel(t.date, period)),
    datasets: [
      {
        label: 'Billable',
        data: timeline.map((t) => t.billableHours),
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
      {
        label: 'Non-Billable',
        data: timeline.map((t) => t.nonBillableHours),
        backgroundColor: '#8b5cf6',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#131b2e',
        borderColor: '#1e293b',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 10,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(1)}h`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: '#0f172a' },
        ticks: { color: '#475569', font: { size: 10 } },
      },
      y: {
        stacked: true,
        grid: { color: '#1e293b' },
        ticks: {
          color: '#475569',
          font: { size: 10 },
          callback: (v: string | number) => v + 'h',
        },
      },
    },
  } as const;

  return (
    <div className="rounded-xl border border-mgs-border bg-mgs-card-alt p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
        <span className="font-mono text-xs uppercase tracking-widest text-mgs-text-dim">
          Hours Over Period
        </span>
        <div className="flex flex-wrap gap-4">
          <LegendItem color="#10b981" label="Billable" />
          <LegendItem color="#8b5cf6" label="Non-Billable" />
        </div>
      </div>
      <div className="relative h-64">
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}
