import { useState } from 'react';
import { mutateApi } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { showToast } from '../ui/Toast';

interface DeletedProject {
  id: number;
  name: string;
  monthlyBudget: number | null;
  deletedAt: string;
  components: { id: number; name: string; deletedAt: string | null }[];
}

interface DeletedComponent {
  id: number;
  name: string;
  isBillable: boolean;
  deletedAt: string;
  project: { id: number; name: string };
}

interface DeletedDeveloper {
  id: number;
  name: string;
  email: string;
  deletedAt: string;
}

interface TrashData {
  projects: DeletedProject[];
  components: DeletedComponent[];
  developers: DeletedDeveloper[];
}

export function TrashPanel() {
  const trash = useApi<TrashData>('/trash');

  if (trash.loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-mgs-card-alt" />
        ))}
      </div>
    );
  }

  if (trash.error) {
    return (
      <div className="rounded-xl border border-mgs-red/30 bg-mgs-red/10 px-4 py-6 text-center text-xs text-mgs-red-light">
        {trash.error}
      </div>
    );
  }

  const data = trash.data!;
  const isEmpty =
    data.projects.length === 0 &&
    data.components.length === 0 &&
    data.developers.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-mgs-border bg-mgs-card-alt px-4 py-12 text-center text-xs text-mgs-text-dim">
        No deleted items
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {data.projects.length > 0 && (
        <TrashSection title="Deleted Projects">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-mgs-border">
                <Th>Name</Th>
                <Th>Budget</Th>
                <Th>Components in Trash</Th>
                <Th>Deleted At</Th>
                <Th className="w-40 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => (
                <ProjectRow key={p.id} project={p} onRefresh={trash.refetch} />
              ))}
            </tbody>
          </table>
        </TrashSection>
      )}

      {data.components.length > 0 && (
        <TrashSection title="Deleted Components">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-mgs-border">
                <Th>Name</Th>
                <Th>Project</Th>
                <Th>Billable</Th>
                <Th>Deleted At</Th>
                <Th className="w-40 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.components.map((c) => (
                <ComponentRow key={c.id} component={c} onRefresh={trash.refetch} />
              ))}
            </tbody>
          </table>
        </TrashSection>
      )}

      {data.developers.length > 0 && (
        <TrashSection title="Deleted Developers">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-mgs-border">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Deleted At</Th>
                <Th className="w-40 text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.developers.map((d) => (
                <DeveloperRow key={d.id} developer={d} onRefresh={trash.refetch} />
              ))}
            </tbody>
          </table>
        </TrashSection>
      )}
    </div>
  );
}

// ---- Section wrapper ----

function TrashSection({ title, children }: { title: string; children: React.ReactNode }) {
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
  project: DeletedProject;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState<'restore' | 'cascade' | null>(null);
  const trashedComponents = project.components.filter((c) => c.deletedAt !== null);

  async function handleRestore(cascade = false) {
    setLoading(cascade ? 'cascade' : 'restore');
    try {
      const url = `/projects/${project.id}/restore${cascade ? '?cascade=1' : ''}`;
      await mutateApi(url, 'PATCH');
      showToast(`Project "${project.name}" restored`);
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Restore failed', 'error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <tr className="border-b border-mgs-border/50 last:border-0">
      <td className="px-4 py-3 font-medium text-mgs-text">{project.name}</td>
      <td className="px-4 py-3 text-mgs-text-muted">{project.monthlyBudget != null ? `${project.monthlyBudget}h` : '—'}</td>
      <td className="px-4 py-3 text-mgs-text-dim">{trashedComponents.length}</td>
      <td className="px-4 py-3 text-mgs-text-dim">{formatDate(project.deletedAt)}</td>
      <td className="px-4 py-3 text-right">
        {trashedComponents.length > 0 ? (
          <button
            disabled={loading !== null}
            onClick={() => handleRestore(true)}
            className="text-mgs-blue transition-colors hover:text-mgs-blue-light disabled:opacity-40"
          >
            {loading === 'cascade' ? '…' : 'Restore+Comps'}
          </button>
        ) : (
          <button
            disabled={loading !== null}
            onClick={() => handleRestore(false)}
            className="text-mgs-blue transition-colors hover:text-mgs-blue-light disabled:opacity-40"
          >
            {loading === 'restore' ? '…' : 'Restore'}
          </button>
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
  component: DeletedComponent;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    setLoading(true);
    try {
      await mutateApi(`/projects/components/${component.id}/restore`, 'PATCH');
      showToast(`Component "${component.name}" restored`);
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Restore failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="border-b border-mgs-border/50 last:border-0">
      <td className="px-4 py-3 font-medium text-mgs-text">{component.name}</td>
      <td className="px-4 py-3 text-mgs-text-muted">{component.project.name}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            component.isBillable
              ? 'bg-mgs-green/20 text-mgs-green'
              : 'bg-mgs-purple/20 text-mgs-purple'
          }`}
        >
          {component.isBillable ? 'Billable' : 'Non-Billable'}
        </span>
      </td>
      <td className="px-4 py-3 text-mgs-text-dim">{formatDate(component.deletedAt)}</td>
      <td className="px-4 py-3 text-right">
        <button
          disabled={loading}
          onClick={handleRestore}
          className="text-mgs-blue transition-colors hover:text-mgs-blue-light disabled:opacity-40"
        >
          {loading ? '…' : 'Restore'}
        </button>
      </td>
    </tr>
  );
}

// ---- Developer row ----

function DeveloperRow({
  developer,
  onRefresh,
}: {
  developer: DeletedDeveloper;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    setLoading(true);
    try {
      await mutateApi(`/developers/${developer.id}/restore`, 'PATCH');
      showToast(`Developer "${developer.name}" restored`);
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Restore failed', 'error');
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
        <button
          disabled={loading}
          onClick={handleRestore}
          className="text-mgs-blue transition-colors hover:text-mgs-blue-light disabled:opacity-40"
        >
          {loading ? '…' : 'Restore'}
        </button>
      </td>
    </tr>
  );
}

// ---- Shared helpers ----

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[1px] text-mgs-text-faint ${className}`}
    >
      {children}
    </th>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
