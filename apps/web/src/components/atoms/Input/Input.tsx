const baseStyle =
  'w-full rounded-lg border border-mgs-border bg-mgs-card-alt px-3 py-2 text-xs text-mgs-text outline-none transition-colors placeholder:text-mgs-text-dim focus:border-mgs-blue';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={className ?? baseStyle} {...props} />;
}
