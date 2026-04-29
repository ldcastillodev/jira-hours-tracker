interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'inline' | 'section' | 'page';
}

const variantStyles: Record<NonNullable<AlertProps['variant']>, string> = {
  inline:
    'rounded-lg border border-mgs-red/30 bg-mgs-red/10 px-3 py-2 text-xs text-mgs-red-light',
  section:
    'rounded-xl border border-mgs-red/30 bg-mgs-red/10 px-4 py-6 text-center text-xs text-mgs-red-light',
  page: 'rounded-xl border border-mgs-red/30 bg-mgs-red/10 p-6 text-center text-sm text-mgs-red-light',
};

export function Alert({
  children,
  className,
  variant = 'inline',
}: AlertProps) {
  return (
    <div className={className ?? variantStyles[variant]}>{children}</div>
  );
}
