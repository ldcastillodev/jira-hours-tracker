import { useSearchParams } from 'react-router-dom';
import { Button } from '../../atoms/Button/Button';
import { Badge } from '../../atoms/Badge/Badge';

export function MonthPicker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const month = searchParams.get('month') || currentMonth();

  function navigate(direction: -1 | 1) {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSearchParams({ month: next });
  }

  const label = formatMonthLabel(month);

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => navigate(-1)}
        className="rounded-lg border border-mgs-border bg-mgs-card px-2 py-1 font-mono text-xs text-mgs-text-dim transition-colors hover:border-mgs-text-dim hover:text-mgs-text-muted"
      >
        ←
      </Button>
      <Badge className="min-w-[120px] rounded-[20px] border border-mgs-border bg-mgs-card px-3 py-1 text-center font-mono text-[10px] uppercase tracking-wider text-mgs-text-dim">
        {label}
      </Badge>
      <Button
        onClick={() => navigate(1)}
        disabled={month >= currentMonth()}
        className="rounded-lg border border-mgs-border bg-mgs-card px-2 py-1 font-mono text-xs text-mgs-text-dim transition-colors hover:border-mgs-text-dim hover:text-mgs-text-muted disabled:cursor-not-allowed disabled:opacity-30"
      >
        →
      </Button>
    </div>
  );
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
