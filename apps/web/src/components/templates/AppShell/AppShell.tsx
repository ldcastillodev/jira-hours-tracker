import { useState, useRef, useEffect } from 'react';
import { NavLink, useSearchParams, useLocation } from 'react-router-dom';
import { MonthPicker } from '../../molecules/MonthPicker/MonthPicker';
import { mutateApi } from '../../../services/api';
import { showToast } from '../../molecules/Toast/Toast';
import { emitDataRefresh } from '../../../hooks/useApi';
import { useTheme } from '../../../hooks/useTheme';
import { Button } from '../../atoms/Button/Button';
import { Spinner } from '../../atoms/Spinner/Spinner';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const month = searchParams.get('month') || currentMonth();
  const location = useLocation();
  const isManage = location.pathname === '/manage';
  const isCustomReports = location.pathname === '/reports/custom';

  return (
    <div className="min-h-screen bg-mgs-bg font-sans">
      {/* Top nav bar */}
      <nav className="border-b border-mgs-border bg-mgs-card-alt px-7 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <span className="font-mono text-sm font-bold tracking-tight text-mgs-text">
              MgS
            </span>
            <div className="flex gap-1">
              <NavTab to={`/?month=${month}`}>Project Hours</NavTab>
              <NavTab to={`/developers?month=${month}`}>Developers</NavTab>
              <NavTab to="/reports/custom">Reports</NavTab>
              <NavTab to="/manage">Manage</NavTab>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SyncButton />
            {!isManage && !isCustomReports && <MonthPicker />}
          </div>
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

function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-based

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  async function handleSelectMonth(monthIdx: number) {
    setOpen(false);
    setSyncing(true);
    try {
      const result = await mutateApi<{ message: string }>(
        `/jira-sync/trigger?month=${monthIdx + 1}`,
        'POST',
      );
      showToast(result.message);
      emitDataRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        onClick={() => { if (!syncing) setOpen((o) => !o); }}
        disabled={syncing}
        className="flex items-center gap-1.5 rounded-lg border border-mgs-border bg-mgs-card px-3 py-1.5 text-xs font-medium text-mgs-text-dim transition-colors hover:border-mgs-text-dim hover:text-mgs-text-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {syncing ? (
          <Spinner className="h-3 w-3 animate-spin" />
        ) : (
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        )}
        {syncing ? 'Syncing...' : 'Sync Jira'}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[168px] overflow-hidden rounded-lg border border-mgs-border bg-mgs-card shadow-lg">
          {MONTHS.map((name, idx) => {
            const isCurrent = idx === currentMonthIdx;
            const isFuture = idx > currentMonthIdx;
            return (
              <button
                key={idx}
                onClick={() => !isFuture && handleSelectMonth(idx)}
                className={`w-full px-3 py-1.5 text-left font-mono text-xs ${
                  isFuture
                    ? 'cursor-not-allowed text-mgs-text-dim opacity-40'
                    : 'cursor-pointer text-mgs-text-dim hover:bg-mgs-card-alt hover:text-mgs-text'
                }`}
              >
                {isCurrent ? `\u2022 ${name} ${currentYear}` : `${name} ${currentYear}`}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 rounded-lg border border-mgs-border bg-mgs-card px-3 py-1.5 font-mono text-xs text-mgs-text-dim transition-colors hover:border-mgs-text-dim hover:text-mgs-text-muted"
    >
      {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </Button>
  );
}
