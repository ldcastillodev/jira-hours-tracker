interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  color: string;
  alert?: string;
  alertColor?: string;
}

export function StatCard({ label, value, unit, sub, color, alert, alertColor }: StatCardProps) {
  return (
    <div className="rounded-[10px] border border-mgs-border bg-mgs-card p-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
        {label}
      </div>
      <div className="font-mono text-[26px] font-bold leading-none" style={{ color }}>
        {value}
        {unit && (
          <span className="text-[14px] text-mgs-text-faint">{unit}</span>
        )}
      </div>
      <div className="mt-1 text-[11px] text-mgs-text-dim">{sub}</div>
      {alert && (
        alertColor ? (
          <div
            className="mt-2 inline-flex items-center gap-1 rounded-[20px] px-2 py-[3px] text-[10px] font-bold uppercase tracking-wider"
            style={{
              border: `1px solid ${alertColor}50`,
              background: `${alertColor}18`,
              color: alertColor,
            }}
          >
            ⚠ {alert}
          </div>
        ) : (
          <div className="mt-2 inline-flex items-center gap-1 rounded-[20px] border border-mgs-red/30 bg-mgs-red/10 px-2 py-[3px] text-[10px] font-bold uppercase tracking-wider text-mgs-red-light">
            ⚠ {alert}
          </div>
        )
      )}
    </div>
  );
}
