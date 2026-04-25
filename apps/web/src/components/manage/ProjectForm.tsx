import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  monthlyBudget: number | null;
}

interface ProjectFormProps {
  initial?: Project;
  onSubmit: (data: { name: string; monthlyBudget?: number | null }) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({ initial, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [budget, setBudget] = useState(initial?.monthlyBudget?.toString() ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        monthlyBudget: budget ? Number(budget) : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-mgs-red/30 bg-mgs-red/10 px-3 py-2 text-xs text-mgs-red-light">
          {error}
        </div>
      )}
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
          Name <span className="text-mgs-red">*</span>
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-mgs-border bg-mgs-card-alt px-3 py-2 text-xs text-mgs-text outline-none transition-colors placeholder:text-mgs-text-dim focus:border-mgs-blue"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
          Monthly Budget (hrs)
        </span>
        <input
          type="number"
          step="any"
          min="0"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full rounded-lg border border-mgs-border bg-mgs-card-alt px-3 py-2 font-mono text-xs text-mgs-text outline-none transition-colors placeholder:text-mgs-text-dim focus:border-mgs-blue"
        />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-mgs-border px-3 py-1.5 text-xs font-medium text-mgs-text-dim transition-colors hover:text-mgs-text"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-mgs-blue px-3 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-50"
        >
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
