import { useState } from 'react';
import { mutateApi } from '../../services/api';
import { Modal } from '../ui/Modal';
import { ProjectForm } from './ProjectForm';
import { showToast } from '../ui/Toast';

interface Project {
  id: number;
  name: string;
  monthlyBudget: number | null;
}

interface ProjectPanelProps {
  projects: Project[];
  onRefresh: () => void;
}

export function ProjectPanel({ projects, onRefresh }: ProjectPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(proj: Project) {
    setEditing(proj);
    setModalOpen(true);
  }

  async function handleSubmit(data: { name: string; monthlyBudget?: number | null }) {
    if (editing) {
      await mutateApi(`/projects/${editing.id}`, 'PATCH', data);
      showToast('Project updated');
    } else {
      await mutateApi('/projects', 'POST', data);
      showToast('Project created');
    }
    setModalOpen(false);
    onRefresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await mutateApi(`/projects/${deleting.id}`, 'DELETE');
      showToast('Project deleted');
      setDeleting(null);
      onRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-[1px] text-mgs-text-faint">
          Projects
        </h2>
        <button
          onClick={openCreate}
          className="rounded-lg bg-mgs-blue px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          + Add Project
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-mgs-border bg-mgs-card-alt">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-mgs-border">
              <Th>Name</Th>
              <Th>Monthly Budget (hrs)</Th>
              <Th className="w-24 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => (
              <tr key={proj.id} className="border-b border-mgs-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-mgs-text">{proj.name}</td>
                <td className="px-4 py-3 font-mono text-mgs-text-muted">
                  {proj.monthlyBudget != null ? proj.monthlyBudget : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(proj)}
                    className="mr-2 text-mgs-blue transition-colors hover:text-mgs-blue-light"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(proj)}
                    className="text-mgs-red transition-colors hover:text-mgs-red-light"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-mgs-text-dim">
                  No projects yet
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
        title={editing ? 'Edit Project' : 'Add Project'}
      >
        <ProjectForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Project"
      >
        <p className="mb-5 text-xs text-mgs-text-muted">
          Are you sure you want to delete <strong className="text-mgs-text">{deleting?.name}</strong>?
          This action cannot be undone.
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
    <th className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.8px] text-mgs-text-faint ${className}`}>
      {children}
    </th>
  );
}
