import { useState } from 'react';

interface Project {
  id: number;
  name: string;
}

interface Developer {
  id: number;
  name: string;
  email: string;
}

export interface FilterValues {
  period: 'day' | 'week' | 'month';
  startDate: string;
  projectIds: number[];
  developerEmails: string[];
}

interface FilterFormProps {
  projects: Project[];
  developers: Developer[];
  onSubmit: (values: FilterValues) => void;
  loading: boolean;
}

/** Snap a YYYY-MM-DD string to the Monday of its week */
function toMonday(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = d.getUTCDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function FilterForm({ projects, developers, onSubmit, loading }: FilterFormProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [startDate, setStartDate] = useState('');
  const [projectIds, setProjectIds] = useState<number[]>([]);
  const [developerEmails, setDeveloperEmails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handlePeriodChange(p: 'day' | 'week' | 'month') {
    setPeriod(p);
    setStartDate(''); // clear stale date when period changes
  }

  function handleDateChange(raw: string) {
    if (period === 'week' && raw) {
      setStartDate(toMonday(raw));
    } else if (period === 'month' && raw) {
      // <input type="month"> gives YYYY-MM — convert to YYYY-MM-01
      setStartDate(`${raw}-01`);
    } else {
      setStartDate(raw);
    }
  }

  function toggleProject(id: number) {
    setProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  function toggleDeveloper(email: string) {
    setDeveloperEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate) {
      setError('Date is required');
      return;
    }
    if (projectIds.length === 0 && developerEmails.length === 0) {
      setError('Select at least one project or developer');
      return;
    }
    setError(null);
    onSubmit({ period, startDate, projectIds, developerEmails });
  }

  const isValid = !!startDate && (projectIds.length > 0 || developerEmails.length > 0);

  // Value for the date/month input (must match input type)
  const dateInputValue =
    period === 'month'
      ? startDate.slice(0, 7) // YYYY-MM
      : startDate; // YYYY-MM-DD

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-mgs-border bg-mgs-card p-5">
      <h2 className="mb-5 text-[10px] font-semibold uppercase tracking-[1px] text-mgs-text-faint">
        Report Filters
      </h2>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Period */}
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
            Period
          </label>
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                  period === p
                    ? 'border-mgs-blue bg-mgs-blue/10 text-mgs-blue'
                    : 'border-mgs-border text-mgs-text-dim hover:text-mgs-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Smart Date Picker */}
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
            {period === 'week' ? 'Week (select any day)' : period === 'month' ? 'Month' : 'Date'}
            {' '}<span className="text-mgs-red">*</span>
          </label>
          {period === 'month' ? (
            <input
              type="month"
              value={dateInputValue}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full rounded-lg border border-mgs-border bg-mgs-card-alt px-3 py-2 text-xs text-mgs-text outline-none transition-colors focus:border-mgs-blue [color-scheme:dark]"
            />
          ) : (
            <input
              type="date"
              value={dateInputValue}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full rounded-lg border border-mgs-border bg-mgs-card-alt px-3 py-2 text-xs text-mgs-text outline-none transition-colors focus:border-mgs-blue [color-scheme:dark]"
            />
          )}
          {period === 'week' && startDate && (
            <p className="mt-1 text-[10px] text-mgs-text-dim">
              Week of {startDate}
            </p>
          )}
        </div>

        {/* Projects multi-select */}
        <MultiSelectBox
          label="Projects"
          items={projects.map((p) => ({ id: String(p.id), label: p.name }))}
          selectedIds={projectIds.map(String)}
          onToggle={(id) => toggleProject(Number(id))}
          onSelectAll={() => setProjectIds(projects.map((p) => p.id))}
          onDeselectAll={() => setProjectIds([])}
        />

        {/* Developers multi-select */}
        <MultiSelectBox
          label="Developers"
          items={developers.map((d) => ({ id: d.email, label: d.name }))}
          selectedIds={developerEmails}
          onToggle={(email) => toggleDeveloper(email)}
          onSelectAll={() => setDeveloperEmails(developers.map((d) => d.email))}
          onDeselectAll={() => setDeveloperEmails([])}
        />
      </div>

      {error && (
        <p className="mt-3 text-xs text-mgs-red-light">{error}</p>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={!isValid || loading}
          className="rounded-lg bg-mgs-blue px-4 py-2 text-xs font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:opacity-90"
        >
          {loading ? 'Generating…' : 'Generate Report'}
        </button>
      </div>
    </form>
  );
}

interface MultiSelectBoxProps {
  label: string;
  items: { id: string; label: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function MultiSelectBox({
  label,
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: MultiSelectBoxProps) {
  const [search, setSearch] = useState('');

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  const allSelected = selectedIds.length === items.length && items.length > 0;
  const selectedCount = selectedIds.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
          {label}
        </label>
        <span className="text-[10px] text-mgs-text-dim">
          {selectedCount} of {items.length} selected
        </span>
      </div>

      <div className="rounded-lg border border-mgs-border bg-mgs-card-alt">
        {/* Search */}
        <div className="border-b border-mgs-border px-2.5 py-1.5">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-mgs-text outline-none placeholder:text-mgs-text-dim"
          />
        </div>

        {/* List */}
        <div className="max-h-32 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 && (
            <p className="px-2 py-1 text-[10px] text-mgs-text-dim italic">No matches</p>
          )}
          {filtered.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-mgs-card"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => onToggle(item.id)}
                className="h-3 w-3 accent-mgs-blue"
              />
              <span className="text-xs text-mgs-text-muted">{item.label}</span>
            </label>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 border-t border-mgs-border px-2.5 py-1.5">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={allSelected}
            className="text-[10px] text-mgs-blue transition-colors hover:text-mgs-blue-light disabled:opacity-40"
          >
            Select All
          </button>
          <span className="text-mgs-border">|</span>
          <button
            type="button"
            onClick={onDeselectAll}
            disabled={selectedCount === 0}
            className="text-[10px] text-mgs-text-dim transition-colors hover:text-mgs-text disabled:opacity-40"
          >
            Deselect All
          </button>
        </div>
      </div>
    </div>
  );
}
