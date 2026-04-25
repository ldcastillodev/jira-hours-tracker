import { useState } from 'react';

interface Developer {
  id: number;
  name: string;
  email: string;
  slackId: string | null;
}

interface DeveloperFormProps {
  initial?: Developer;
  onSubmit: (data: {
    name: string;
    email: string;
    slackId?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function DeveloperForm({ initial, onSubmit, onCancel }: DeveloperFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [slackId, setSlackId] = useState(initial?.slackId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name,
        email,
        slackId: slackId || null,
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
      <Field label="Name" required>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email" required>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Slack ID">
        <input value={slackId} onChange={(e) => setSlackId(e.target.value)} />
      </Field>
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactElement }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
        {label} {required && <span className="text-mgs-red">*</span>}
      </span>
      <div className="[&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-mgs-border [&>input]:bg-mgs-card-alt [&>input]:px-3 [&>input]:py-2 [&>input]:text-xs [&>input]:text-mgs-text [&>input]:outline-none [&>input]:transition-colors [&>input]:placeholder:text-mgs-text-dim [&>input]:focus:border-mgs-blue">
        {children}
      </div>
    </label>
  );
}
