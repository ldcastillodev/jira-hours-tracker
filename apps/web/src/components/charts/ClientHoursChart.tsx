import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ClientHoursDto } from '@mgs/shared';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface ClientHoursChartProps {
  clients: ClientHoursDto[];
}

export function ClientHoursChart({ clients }: ClientHoursChartProps) {
  const filtered = clients.filter((c) => c.contracted > 0 || c.used > 0);

  const data = {
    labels: filtered.map((c) => c.projectName),
    datasets: [
      {
        label: 'Contratadas',
        data: filtered.map((c) => c.contracted),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        label: 'Usadas',
        data: filtered.map((c) => c.used),
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
      {
        label: 'Restantes / Excedente',
        data: filtered.map((c) => Math.abs(c.remaining)),
        backgroundColor: filtered.map((c) =>
          c.remaining < 0 ? '#ef4444' : '#8b5cf6',
        ),
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
      },
    },
    scales: {
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
    },
  } as const;

  return (
    <div className="rounded-xl border border-mgs-border bg-mgs-card-alt p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
        <span className="font-mono text-xs uppercase tracking-widest text-mgs-text-dim">
          Horas por Cliente (Contracted vs Used vs Remaining)
        </span>
        <div className="flex flex-wrap gap-4">
          <LegendItem color="#3b82f6" label="Contratadas" />
          <LegendItem color="#10b981" label="Usadas" />
          <LegendItem color="#8b5cf6" label="Restantes" />
        </div>
      </div>
      <div className="relative h-[340px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-[5px] text-[11px] uppercase tracking-wider text-mgs-text-muted">
      <div className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
      {label}
    </div>
  );
}
