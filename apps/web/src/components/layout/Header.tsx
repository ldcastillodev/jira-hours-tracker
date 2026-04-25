interface HeaderProps {
  title: string;
  subtitle: string;
  badge: string;
}

export function Header({ title, subtitle, badge }: HeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-mgs-border pb-5">
      <div>
        <h1 className="font-mono text-xl font-bold tracking-tight text-[#f8fafc]">
          {title}
        </h1>
        <p className="mt-1 text-xs text-mgs-text-faint">{subtitle}</p>
      </div>
      <span className="rounded-[20px] border border-mgs-border bg-mgs-card px-2.5 py-1 font-mono text-[10px] tracking-wider text-mgs-text-dim">
        {badge}
      </span>
    </div>
  );
}
