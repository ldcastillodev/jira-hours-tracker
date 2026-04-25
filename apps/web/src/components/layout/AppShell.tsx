import { NavLink, useSearchParams } from 'react-router-dom';
import { MonthPicker } from './MonthPicker';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const month = searchParams.get('month') || currentMonth();

  return (
    <div className="min-h-screen bg-mgs-bg font-sans">
      {/* Top nav bar */}
      <nav className="border-b border-mgs-border bg-mgs-card-alt px-7 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <span className="font-mono text-sm font-bold tracking-tight text-[#f8fafc]">
              MgS
            </span>
            <div className="flex gap-1">
              <NavTab to={`/?month=${month}`}>Client Hours</NavTab>
              <NavTab to={`/developers?month=${month}`}>Developers</NavTab>
            </div>
          </div>
          <MonthPicker />
        </div>
      </nav>

      {/* Page content */}
      <div className="p-7">{children}</div>
    </div>
  );
}

function NavTab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          isActive
            ? 'bg-mgs-card text-mgs-text'
            : 'text-mgs-text-dim hover:text-mgs-text-muted'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
