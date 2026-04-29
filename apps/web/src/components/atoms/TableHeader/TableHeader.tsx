type TableHeaderProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export function TableHeader({ children, className, ...props }: TableHeaderProps) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}
