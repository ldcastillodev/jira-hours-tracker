interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, className, style }: BadgeProps) {
  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
}
