interface LabelProps {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export function Label({ children, required, className }: LabelProps) {
  return (
    <span
      className={
        className ??
        'mb-1 block text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint'
      }
    >
      {children}
      {required && <span className="text-mgs-red"> *</span>}
    </span>
  );
}
