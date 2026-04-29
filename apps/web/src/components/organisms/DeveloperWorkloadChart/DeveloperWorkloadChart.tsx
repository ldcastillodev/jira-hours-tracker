import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { DeveloperWorkloadDto } from '@mgs/shared';
import { LegendItem } from '../../atoms/LegendItem/LegendItem';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface DeveloperWorkloadChartProps {
  developers: DeveloperWorkloadDto[];
}

export function DeveloperWorkloadChart({
  developers,
}: DeveloperWorkloadChartProps) {
  const sorted = [...developers].sort((a, b) => b.totalHours - a.totalHours);

  const data = {
    labels: sorted.map((d) => d.developerName),
    datasets: [
      {
        label: 'Billable',
        data: sorted.map((d) => d.billableHours),
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
      {
        label: 'Non-Billable',
        data: sorted.map((d) => d.nonBillableHours),
        backgroundColor: '#8b5cf6',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#131b2e',
        borderColor: '#1e293b',
        borderWidth: 1,
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        padding: 10,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: '#1e293b' },
        ticks: {
          color: '#475569',
          font: { size: 10 },
          callback: (v: string | number) => v + 'h',
        },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
    },
  } as const;

  return (
    <div className="rounded-xl border border-mgs-border bg-mgs-card-alt p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
        <span className="font-mono text-xs uppercase tracking-widest text-mgs-text-dim">
          Developer Hours (Billable vs Non-Billable)
        </span>
        <div className="flex flex-wrap gap-4">
          <LegendItem color="#10b981" label="Billable" />
          <LegendItem color="#8b5cf6" label="Non-Billable" />
        </div>
      </div>
      <div
        className="relative"
        style={{ height: Math.max(200, sorted.length * 40) }}
      >
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}


