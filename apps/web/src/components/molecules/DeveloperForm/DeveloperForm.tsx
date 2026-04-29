import { useState } from 'react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { Label } from '../../atoms/Label/Label';
import { Alert } from '../../atoms/Alert/Alert';

interface Developer {
  id: number;
  name: string;
  email: string;
  slackId: string | null;
}

interface DeveloperFormProps {
  initial?: Developer;
  onSubmit: (data: { name: string; email: string; slackId?: string | null }) => Promise<void>;
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
      {error && <Alert variant="inline">{error}</Alert>}
      <Field label="Name" required>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email" required>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Slack ID">
        <Input value={slackId} onChange={(e) => setSlackId(e.target.value)} />
      </Field>
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactElement;
}) {
  return (
    <label className="block">
      <Label required={required}>{label}</Label>
      {children}
    </label>
  );
}
