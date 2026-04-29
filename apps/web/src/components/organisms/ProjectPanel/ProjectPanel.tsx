import { useState } from 'react';
import { mutateApi } from '../../../services/api';
import { Modal } from '../../atoms/Modal/Modal';
import { Button } from '../../atoms/Button/Button';
import { TableHeader } from '../../atoms/TableHeader/TableHeader';
import { ProjectForm } from '../../molecules/ProjectForm/ProjectForm';
import { ConfirmDialog } from '../../molecules/ConfirmDialog/ConfirmDialog';
import { showToast } from '../../molecules/Toast/Toast';

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
        <Button variant="primary" onClick={openCreate}>
          + Add Project
        </Button>
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
                  <Button variant="link-blue" className="mr-2" onClick={() => openEdit(proj)}>
                    Edit
                  </Button>
                  <Button variant="link-red" onClick={() => setDeleting(proj)}>
                    Delete
                  </Button>
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
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong className="text-mgs-text">{deleting?.name}</strong>?
          </>
        }
        loading={deleteLoading}
      />
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <TableHeader
      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.8px] text-mgs-text-faint ${className}`}
    >
      {children}
    </TableHeader>
  );
}
