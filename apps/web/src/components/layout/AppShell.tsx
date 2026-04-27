import { useState } from 'react';
import { NavLink, useSearchParams, useLocation } from 'react-router-dom';
import { MonthPicker } from './MonthPicker';
import { mutateApi } from '../../services/api';
import { showToast } from '../ui/Toast';
import { useTheme } from '../../hooks/useTheme';

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
              <NavTab to={`/?month=${month}`}>Client Hours</NavTab>
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

  async function handleSync() {
    setSyncing(true);
    try {
      await mutateApi('/jira-sync/trigger', 'POST');
      showToast('Jira sync completed');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="flex items-center gap-1.5 rounded-lg border border-mgs-border bg-mgs-card px-3 py-1.5 text-xs font-medium text-mgs-text-dim transition-colors hover:border-mgs-text-dim hover:text-mgs-text-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {syncing ? (
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
      )}
      {syncing ? 'Syncing...' : 'Sync Jira'}
    </button>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 rounded-lg border border-mgs-border bg-mgs-card px-3 py-1.5 font-mono text-xs text-mgs-text-dim transition-colors hover:border-mgs-text-dim hover:text-mgs-text-muted"
    >
      {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}
