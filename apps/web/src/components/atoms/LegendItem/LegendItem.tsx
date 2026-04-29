interface LegendItemProps {
  color: string;
  label: string;
  className?: string;
}

export function LegendItem({ color, label, className }: LegendItemProps) {
  return (
    <div
      className={
        className ??
        'flex items-center gap-[5px] text-[11px] uppercase tracking-wider text-mgs-text-muted'
      }
    >
      <div className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
      {label}
    </div>
  );
}
