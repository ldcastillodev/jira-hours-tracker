import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ClientHoursDto } from '@mgs/shared';
import { LegendItem } from '../../atoms/LegendItem/LegendItem';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface ClientHoursChartProps {
  clients: ClientHoursDto[];
}

const tooltipStyle = {
  backgroundColor: '#131b2e',
  borderColor: '#1e293b',
  borderWidth: 1,
  titleColor: '#f1f5f9',
  bodyColor: '#94a3b8',
  padding: 10,
} as const;

const scaleStyle = {
  x: {
    grid: { color: '#0f172a' },
    ticks: { color: '#475569', font: { size: 10 } },
  },
  y: {
    grid: { color: '#1e293b' },
    ticks: {
      color: '#475569',
      font: { size: 10 },
      callback: (v: string | number) => v + 'h',
    },
  },
} as const;

export function ClientHoursChart({ clients }: ClientHoursChartProps) {
  const billable = clients.filter((c) => c.isBillable && (c.contracted > 0 || c.used > 0));
  const nonBillable = clients.filter((c) => !c.isBillable && c.used > 0);

  return (
    <div className="space-y-5">
      {billable.length > 0 && (
        <div className="rounded-xl border border-mgs-border bg-mgs-card-alt p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
            <span className="font-mono text-xs uppercase tracking-[1px] text-mgs-text-dim">
              Hours by Project — Billable
            </span>
            <div className="flex flex-wrap gap-4">
              <LegendItem color="#3b82f6" label="Contracted" />
              <LegendItem color="#10b981" label="Used" />
              <LegendItem color="#8b5cf6" label="Remaining" />
            </div>
          </div>
          <div className="h-[300px]">
            <Bar
              data={{
                labels: billable.map((c) => c.projectName),
                datasets: [
                  {
                    label: 'Contracted',
                    data: billable.map((c) => c.contracted),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                    barThickness: 48,
                  },
                  {
                    label: 'Used',
                    data: billable.map((c) => c.used),
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    barThickness: 48,
                  },
                  {
                    label: 'Remaining / Overage',
                    data: billable.map((c) => Math.abs(c.remaining)),
                    backgroundColor: billable.map((c) => (c.remaining < 0 ? '#ef4444' : '#8b5cf6')),
                    borderRadius: 4,
                    barThickness: 48,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: tooltipStyle },
                scales: scaleStyle,
              }}
            />
          </div>
        </div>
      )}

      {nonBillable.length > 0 && (
        <div className="rounded-xl border border-mgs-border bg-mgs-card-alt p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
            <span className="font-mono text-xs uppercase tracking-[1px] text-mgs-text-dim">
              Hours by Project — Non-Billable
            </span>
            <div className="flex flex-wrap gap-4">
              <LegendItem color="#8b5cf6" label="Hours Used" />
            </div>
          </div>
          <div className="h-[260px]">
            <Bar
              data={{
                labels: nonBillable.map((c) => c.projectName),
                datasets: [
                  {
                    label: 'Hours Used',
                    data: nonBillable.map((c) => c.used),
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4,
                    barThickness: 48,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: tooltipStyle },
                scales: scaleStyle,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
