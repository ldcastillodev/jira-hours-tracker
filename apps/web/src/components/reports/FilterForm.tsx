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

export function FilterForm({ projects, developers, onSubmit, loading }: FilterFormProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [startDate, setStartDate] = useState('');
  const [projectIds, setProjectIds] = useState<number[]>([]);
  const [developerEmails, setDeveloperEmails] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  function toggleAllProjects() {
    setProjectIds((prev) =>
      prev.length === projects.length ? [] : projects.map((p) => p.id),
    );
  }

  function toggleAllDevelopers() {
    setDeveloperEmails((prev) =>
      prev.length === developers.length ? [] : developers.map((d) => d.email),
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
                onClick={() => setPeriod(p)}
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

        {/* Date */}
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
            Start Date <span className="text-mgs-red">*</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-mgs-border bg-mgs-card-alt px-3 py-2 text-xs text-mgs-text outline-none transition-colors placeholder:text-mgs-text-dim focus:border-mgs-blue [color-scheme:dark]"
          />
        </div>

        {/* Projects */}
        <MultiSelect
          label="Projects"
          allSelected={projectIds.length === projects.length && projects.length > 0}
          noneSelected={projectIds.length === 0}
          onToggleAll={toggleAllProjects}
        >
          {projects.map((p) => (
            <CheckItem
              key={p.id}
              label={p.name}
              checked={projectIds.includes(p.id)}
              onChange={() => toggleProject(p.id)}
            />
          ))}
        </MultiSelect>

        {/* Developers */}
        <MultiSelect
          label="Developers"
          allSelected={developerEmails.length === developers.length && developers.length > 0}
          noneSelected={developerEmails.length === 0}
          onToggleAll={toggleAllDevelopers}
        >
          {developers.map((d) => (
            <CheckItem
              key={d.email}
              label={d.name}
              checked={developerEmails.includes(d.email)}
              onChange={() => toggleDeveloper(d.email)}
            />
          ))}
        </MultiSelect>
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

function MultiSelect({
  label,
  allSelected,
  noneSelected,
  onToggleAll,
  children,
}: {
  label: string;
  allSelected: boolean;
  noneSelected: boolean;
  onToggleAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
          {label}
        </label>
        <button
          type="button"
          onClick={onToggleAll}
          className="text-[10px] text-mgs-blue transition-colors hover:text-mgs-blue-light"
        >
          {allSelected ? 'None' : 'All'}
        </button>
      </div>
      <div className="max-h-32 overflow-y-auto rounded-lg border border-mgs-border bg-mgs-card-alt p-2 space-y-1">
        {children}
        {noneSelected && (
          <p className="px-1 text-[10px] text-mgs-text-dim italic">None selected</p>
        )}
      </div>
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 transition-colors hover:bg-mgs-card">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3 w-3 accent-mgs-blue"
      />
      <span className="text-xs text-mgs-text-muted">{label}</span>
    </label>
  );
}
