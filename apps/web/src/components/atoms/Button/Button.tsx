interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'link-blue' | 'link-red';
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'rounded-lg bg-mgs-blue px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50',
  secondary:
    'rounded-lg border border-mgs-border px-3 py-1.5 text-xs font-medium text-mgs-text-dim transition-colors hover:text-mgs-text',
  danger:
    'rounded-lg bg-mgs-red px-3 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-50',
  'link-blue': 'text-mgs-blue transition-colors hover:text-mgs-blue-light disabled:opacity-40',
  'link-red': 'text-mgs-red transition-colors hover:text-mgs-red-light',
};

export function Button({ variant, className, children, ...props }: ButtonProps) {
  const classes = [variant && variantStyles[variant], className].filter(Boolean).join(' ');
  return (
    <button className={classes || undefined} {...props}>
      {children}
    </button>
  );
}
