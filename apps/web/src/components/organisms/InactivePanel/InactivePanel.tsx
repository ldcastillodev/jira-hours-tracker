import { useState } from 'react';
import { mutateApi } from '../../../services/api';
import { useApi } from '../../../hooks/useApi';
import { Button } from '../../atoms/Button/Button';
import { Badge } from '../../atoms/Badge/Badge';
import { TableHeader } from '../../atoms/TableHeader/TableHeader';
import { Alert } from '../../atoms/Alert/Alert';
import { showToast } from '../../molecules/Toast/Toast';

interface InactiveProject {
  id: number;
  name: string;
  monthlyBudget: number | null;
  deletedAt: string;
  components: { id: number; name: string; deletedAt: string | null }[];
}

interface InactiveComponent {
  id: number;
  name: string;
  isBillable: boolean;
  deletedAt: string;
  project: { id: number; name: string };
}

interface InactiveDeveloper {
  id: number;
  name: string;
  email: string;
  deletedAt: string;
}

interface InactiveData {
  projects: InactiveProject[];
  components: InactiveComponent[];
  developers: InactiveDeveloper[];
}

export function InactivePanel() {
  const inactive = useApi<InactiveData>('/inactive');

  if (inactive.loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-mgs-card-alt" />
        ))}
      </div>
    );
  }

  if (inactive.error) {
    return (
      <Alert variant="section">
        {inactive.error}
      </Alert>
    );
  }

  const data = inactive.data!;
  const isEmpty =
    data.projects.length === 0 &&
    data.components.length === 0 &&
    data.developers.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-mgs-border bg-mgs-card-alt px-4 py-12 text-center text-xs text-mgs-text-dim">
        No inactive items
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {data.projects.length > 0 && (
        <InactiveSection title="Inactive Projects">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-mgs-border">
                <Th>Name</Th>
                <Th>Budget</Th>
                <Th>Components Inactive</Th>
                <Th>Deactivated At</Th>
                <Th className="w-40 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => (
                <ProjectRow key={p.id} project={p} onRefresh={inactive.refetch} />
              ))}
            </tbody>
          </table>
        </InactiveSection>
      )}

      {data.components.length > 0 && (
        <InactiveSection title="Inactive Components">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-mgs-border">
                <Th>Name</Th>
                <Th>Project</Th>
                <Th>Billable</Th>
                <Th>Deactivated At</Th>
                <Th className="w-40 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.components.map((c) => (
                <ComponentRow key={c.id} component={c} onRefresh={inactive.refetch} />
              ))}
            </tbody>
          </table>
        </InactiveSection>
      )}

      {data.developers.length > 0 && (
        <InactiveSection title="Inactive Developers">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-mgs-border">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Deactivated At</Th>
                <Th className="w-40 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.developers.map((d) => (
                <DeveloperRow key={d.id} developer={d} onRefresh={inactive.refetch} />
              ))}
            </tbody>
          </table>
        </InactiveSection>
      )}
    </div>
  );
}

// ---- Section wrapper ----

function InactiveSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[1px] text-mgs-text-faint">
        {title}
      </h3>
      <div className="overflow-x-auto rounded-xl border border-mgs-border bg-mgs-card-alt">
        {children}
      </div>
    </div>
  );
}

// ---- Project row ----

function ProjectRow({
  project,
  onRefresh,
}: {
  project: InactiveProject;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState<'activate' | 'cascade' | null>(null);
  const inactiveComponents = project.components.filter((c) => c.deletedAt !== null);

  async function handleActivate(cascade = false) {
    setLoading(cascade ? 'cascade' : 'activate');
    try {
      const url = `/projects/${project.id}/activate${cascade ? '?cascade=1' : ''}`;
      await mutateApi(url, 'PATCH');
      showToast(`Project "${project.name}" activated`);
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Activation failed', 'error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <tr className="border-b border-mgs-border/50 last:border-0">
      <td className="px-4 py-3 font-medium text-mgs-text">{project.name}</td>
      <td className="px-4 py-3 text-mgs-text-muted">{project.monthlyBudget != null ? `${project.monthlyBudget}h` : '—'}</td>
      <td className="px-4 py-3 text-mgs-text-dim">{inactiveComponents.length}</td>
      <td className="px-4 py-3 text-mgs-text-dim">{formatDate(project.deletedAt)}</td>
      <td className="px-4 py-3 text-right">
        {inactiveComponents.length > 0 ? (
          <Button
            variant="link-blue"
            disabled={loading !== null}
            onClick={() => handleActivate(true)}
          >
            {loading === 'cascade' ? '…' : 'Activate+Comps'}
          </Button>
        ) : (
          <Button
            variant="link-blue"
            disabled={loading !== null}
            onClick={() => handleActivate(false)}
          >
            {loading === 'activate' ? '…' : 'Activate'}
          </Button>
        )}
      </td>
    </tr>
  );
}

// ---- Component row ----

function ComponentRow({
  component,
  onRefresh,
}: {
  component: InactiveComponent;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    try {
      await mutateApi(`/projects/components/${component.id}/activate`, 'PATCH');
      showToast(`Component "${component.name}" activated`);
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Activation failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="border-b border-mgs-border/50 last:border-0">
      <td className="px-4 py-3 font-medium text-mgs-text">{component.name}</td>
      <td className="px-4 py-3 text-mgs-text-muted">{component.project.name}</td>
      <td className="px-4 py-3">
        <Badge
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            component.isBillable
              ? 'bg-mgs-green/20 text-mgs-green'
              : 'bg-mgs-purple/20 text-mgs-purple'
          }`}
        >
          {component.isBillable ? 'Billable' : 'Non-Billable'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-mgs-text-dim">{formatDate(component.deletedAt)}</td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="link-blue"
          disabled={loading}
          onClick={handleActivate}
        >
          {loading ? '…' : 'Activate'}
        </Button>
      </td>
    </tr>
  );
}

// ---- Developer row ----

function DeveloperRow({
  developer,
  onRefresh,
}: {
  developer: InactiveDeveloper;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    try {
      await mutateApi(`/developers/${developer.id}/activate`, 'PATCH');
      showToast(`Developer "${developer.name}" activated`);
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Activation failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="border-b border-mgs-border/50 last:border-0">
      <td className="px-4 py-3 font-medium text-mgs-text">{developer.name}</td>
      <td className="px-4 py-3 text-mgs-text-muted">{developer.email}</td>
      <td className="px-4 py-3 text-mgs-text-dim">{formatDate(developer.deletedAt)}</td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="link-blue"
          disabled={loading}
          onClick={handleActivate}
        >
          {loading ? '…' : 'Activate'}
        </Button>
      </td>
    </tr>
  );
}

// ---- Shared helpers ----

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <TableHeader
      className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[1px] text-mgs-text-faint ${className}`}
    >
      {children}
    </TableHeader>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
