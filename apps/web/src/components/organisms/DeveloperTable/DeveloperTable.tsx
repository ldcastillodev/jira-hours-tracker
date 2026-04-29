import type { DeveloperWorkloadDto } from '@mgs/shared';
import { TableHeader } from '../../atoms/TableHeader/TableHeader';

interface DeveloperTableProps {
  developers: DeveloperWorkloadDto[];
}

export function DeveloperTable({ developers }: DeveloperTableProps) {
  const sorted = [...developers].sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="overflow-hidden rounded-xl border border-mgs-border bg-mgs-card-alt">
      <div className="px-5 pt-[18px]">
        <span className="font-mono text-xs uppercase tracking-widest text-mgs-text-dim">
          Developer Breakdown
        </span>
      </div>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <Th align="left">Developer</Th>
            <Th>Billable</Th>
            <Th>Non-Billable</Th>
            <Th>Total</Th>
            <Th>Billable %</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <DeveloperRow key={d.developerId} developer={d} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align = 'right',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <TableHeader
      className={`border-b border-mgs-border bg-mgs-bg px-4 py-2.5 font-mono text-[10px] font-normal uppercase tracking-wider text-mgs-text-faint ${
        align === 'left' ? 'text-left' : 'text-right'
      }`}
    >
      {children}
    </TableHeader>
  );
}

function DeveloperRow({ developer }: { developer: DeveloperWorkloadDto }) {
  const billablePct =
    developer.totalHours > 0
      ? (developer.billableHours / developer.totalHours) * 100
      : 0;

  let pctColor = '#10b981';
  if (billablePct < 50) pctColor = '#ef4444';
  else if (billablePct < 75) pctColor = '#f59e0b';

  return (
    <tr className="group">
      <td className="border-b border-mgs-border-dark px-4 py-2.5 text-left font-medium text-mgs-text group-hover:bg-mgs-card">
        {developer.developerName}
      </td>
      <td className="border-b border-mgs-border-dark px-4 py-2.5 text-right font-mono text-[11px] text-mgs-green-light group-hover:bg-mgs-card">
        {developer.billableHours.toFixed(2)}
      </td>
      <td className="border-b border-mgs-border-dark px-4 py-2.5 text-right font-mono text-[11px] text-mgs-purple-light group-hover:bg-mgs-card">
        {developer.nonBillableHours.toFixed(2)}
      </td>
      <td className="border-b border-mgs-border-dark px-4 py-2.5 text-right font-mono text-[11px] text-mgs-blue-light group-hover:bg-mgs-card">
        {developer.totalHours.toFixed(2)}
      </td>
      <td className="border-b border-mgs-border-dark px-4 py-2.5 text-right group-hover:bg-mgs-card">
        <div className="flex items-center justify-end gap-2">
          <div className="h-1 w-20 overflow-hidden rounded-sm bg-mgs-border">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${Math.min(billablePct, 100)}%`,
                background: pctColor,
              }}
            />
          </div>
          <span
            className="min-w-[42px] font-mono text-[11px]"
            style={{ color: pctColor }}
          >
            {billablePct.toFixed(1)}%
          </span>
        </div>
      </td>
    </tr>
  );
}
