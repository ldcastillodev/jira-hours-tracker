import { useState } from 'react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { Label } from '../../atoms/Label/Label';
import { Alert } from '../../atoms/Alert/Alert';

interface Project {
  id: number;
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
      {error && <Alert variant="inline">{error}</Alert>}
      <label className="block">
        <Label required>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="block">
        <Label>Monthly Budget (hrs)</Label>
        <Input
          type="number"
          step="any"
          min="0"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full rounded-lg border border-mgs-border bg-mgs-card-alt px-3 py-2 font-mono text-xs text-mgs-text outline-none transition-colors placeholder:text-mgs-text-dim focus:border-mgs-blue"
        />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
