import type { ClientHoursDto } from '@mgs/shared';

interface ClientTableProps {
  clients: ClientHoursDto[];
}

export function ClientTable({ clients }: ClientTableProps) {
  const visible = clients.filter((c) => c.contracted > 0 || c.used > 0);

  return (
    <div className="overflow-hidden rounded-xl border border-mgs-border bg-mgs-card-alt">
      <div className="px-5 pt-[18px]">
        <span className="font-mono text-xs uppercase tracking-[1px] text-mgs-text-dim">
          Detalle de Clientes
        </span>
      </div>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <Th align="left">Cliente</Th>
            <Th>Contratadas</Th>
            <Th>Usadas</Th>
            <Th>Restantes</Th>
            <Th>% Usado</Th>
          </tr>
        </thead>
        <tbody>
          {visible.map((c) => (
            <ClientRow key={c.projectId} client={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`border-b border-mgs-border bg-mgs-bg px-4 py-2.5 font-mono text-[10px] font-normal uppercase tracking-[0.8px] text-mgs-text-faint ${
        align === 'left' ? 'text-left' : 'text-right'
      }`}
    >
      {children}
    </th>
  );
}

function ClientRow({ client }: { client: ClientHoursDto }) {
  const isOver = client.remaining < 0;

  let pctColor = '#10b981';
  if (client.percentUsed > 100) pctColor = '#ef4444';
  else if (client.percentUsed >= 85) pctColor = '#f59e0b';
  else if (client.percentUsed > 0) pctColor = '#10b981';
  else pctColor = '#475569';

  return (
    <tr className="group">
      <td className="border-b border-mgs-border-dark px-4 py-2.5 text-left font-medium text-mgs-text group-hover:bg-mgs-card">
        {client.projectName}
      </td>
      <td className="border-b border-mgs-border-dark px-4 py-2.5 text-right font-mono text-[11px] text-mgs-blue-light group-hover:bg-mgs-card">
        {client.contracted.toFixed(2)}
      </td>
      <td className="border-b border-mgs-border-dark px-4 py-2.5 text-right font-mono text-[11px] text-mgs-green-light group-hover:bg-mgs-card">
        {client.used.toFixed(2)}
      </td>
      <td className={`border-b border-mgs-border-dark px-4 py-2.5 text-right font-mono text-[11px] group-hover:bg-mgs-card ${isOver ? 'text-mgs-red-light' : 'text-mgs-purple-light'}`}>
        {Math.abs(client.remaining).toFixed(2)}
        {isOver && (
          <span className="ml-1.5 rounded-[3px] border border-mgs-red/25 bg-mgs-red/10 px-[5px] py-[1px] text-[9px] font-bold uppercase tracking-tight text-mgs-red-light">
            EXCEDIDO
          </span>
        )}
      </td>
      <td className="border-b border-mgs-border-dark px-4 py-2.5 text-right group-hover:bg-mgs-card">
        <div className="flex items-center justify-end gap-2">
          <div className="h-1 w-20 overflow-hidden rounded-sm bg-mgs-border">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${Math.min(client.percentUsed, 100)}%`,
                background: pctColor,
              }}
            />
          </div>
          <span className="min-w-[42px] font-mono text-[11px]" style={{ color: pctColor }}>
            {client.percentUsed.toFixed(1)}%
          </span>
        </div>
      </td>
    </tr>
  );
}
