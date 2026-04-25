import { useState } from 'react';
import { mutateApi } from '../../services/api';
import { Modal } from '../ui/Modal';
import { showToast } from '../ui/Toast';

interface Component {
  id: number;
  name: string;
  isBillable: boolean;
  projectId: number;
}

interface Project {
  id: number;
  name: string;
}

interface ComponentPanelProps {
  components: Component[];
  projects: Project[];
  onRefresh: () => void;
}

export function ComponentPanel({ components, projects, onRefresh }: ComponentPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Component | undefined>();
  const [deleting, setDeleting] = useState<Component | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const [projectId, setProjectId] = useState<number | ''>('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditing(undefined);
    setName('');
    setIsBillable(true);
    setProjectId(projects[0]?.id ?? '');
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(comp: Component) {
    setEditing(comp);
    setName(comp.name);
    setIsBillable(comp.isBillable);
    setProjectId(comp.projectId);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      if (editing) {
        await mutateApi(`/projects/components/${editing.id}`, 'PATCH', { name, isBillable });
        showToast('Component updated');
      } else {
        await mutateApi(`/projects/${projectId}/components`, 'POST', { name, isBillable });
        showToast('Component created');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await mutateApi(`/projects/components/${deleting.id}`, 'DELETE');
      showToast('Component deleted');
      setDeleting(null);
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  const projectNameMap = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-[1px] text-mgs-text-faint">
          Components
        </h2>
        <button
          onClick={openCreate}
          className="rounded-lg bg-mgs-blue px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          + Add Component
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-mgs-border bg-mgs-card-alt">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-mgs-border">
              <Th>Name</Th>
              <Th>Project</Th>
              <Th>Billable</Th>
              <Th className="w-24 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {components.map((comp) => (
              <tr key={comp.id} className="border-b border-mgs-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-mgs-text">{comp.name}</td>
                <td className="px-4 py-3 text-mgs-text-muted">
                  {projectNameMap.get(comp.projectId) ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      comp.isBillable
                        ? 'bg-mgs-green/10 text-mgs-green-light'
                        : 'bg-mgs-text-dim/10 text-mgs-text-dim'
                    }`}
                  >
                    {comp.isBillable ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(comp)}
                    className="mr-2 text-mgs-blue transition-colors hover:text-mgs-blue-light"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(comp)}
                    className="text-mgs-red transition-colors hover:text-mgs-red-light"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {components.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-mgs-text-dim">
                  No components yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Component' : 'Add Component'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-mgs-red/30 bg-mgs-red/10 px-3 py-2 text-xs text-mgs-red-light">
              {formError}
            </div>
          )}
          {!editing && (
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.9px] text-mgs-text-faint">
                Project <span className="text-mgs-red">*</span>
              </span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}
                required
                className="w-full rounded-lg border border-mgs-border bg-mgs-card-alt px-3 py-2 text-xs text-mgs-text outline-none transition-colors focus:border-mgs-blue"
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-mgs-border accent-mgs-blue"
            />
            <span className="text-xs text-mgs-text-muted">Billable</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-mgs-border px-3 py-1.5 text-xs font-medium text-mgs-text-dim transition-colors hover:text-mgs-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="rounded-lg bg-mgs-blue px-3 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Component"
      >
        <p className="mb-5 text-xs text-mgs-text-muted">
          Are you sure you want to delete{' '}
          <strong className="text-mgs-text">{deleting?.name}</strong>? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleting(null)}
            className="rounded-lg border border-mgs-border px-3 py-1.5 text-xs font-medium text-mgs-text-dim transition-colors hover:text-mgs-text"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="rounded-lg bg-mgs-red px-3 py-1.5 text-xs font-medium text-white transition-opacity disabled:opacity-50"
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.8px] text-mgs-text-faint ${className}`}
    >
      {children}
    </th>
  );
}
