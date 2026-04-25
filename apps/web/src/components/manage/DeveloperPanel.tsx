import { useState } from 'react';
import { mutateApi } from '../../services/api';
import { Modal } from '../ui/Modal';
import { DeveloperForm } from './DeveloperForm';
import { showToast } from '../ui/Toast';

interface Developer {
  id: number;
  name: string;
  email: string;
  jiraAccountId: string;
  slackId: string | null;
}

interface DeveloperPanelProps {
  developers: Developer[];
  onRefresh: () => void;
}

export function DeveloperPanel({ developers, onRefresh }: DeveloperPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Developer | undefined>();
  const [deleting, setDeleting] = useState<Developer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(dev: Developer) {
    setEditing(dev);
    setModalOpen(true);
  }

  async function handleSubmit(data: {
    name: string;
    email: string;
    jiraAccountId?: string | null;
    slackId?: string | null;
  }) {
    if (editing) {
      await mutateApi(`/developers/${editing.id}`, 'PATCH', data);
      showToast('Developer updated');
    } else {
      await mutateApi('/developers', 'POST', data);
      showToast('Developer created');
    }
    setModalOpen(false);
    onRefresh();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await mutateApi(`/developers/${deleting.id}`, 'DELETE');
      showToast('Developer deleted');
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
          Developers
        </h2>
        <button
          onClick={openCreate}
          className="rounded-lg bg-mgs-blue px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          + Add Developer
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-mgs-border bg-mgs-card-alt">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-mgs-border">
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Jira ID</Th>
              <Th>Slack ID</Th>
              <Th className="w-24 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {developers.map((dev) => (
              <tr key={dev.id} className="border-b border-mgs-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-mgs-text">{dev.name}</td>
                <td className="px-4 py-3 text-mgs-text-muted">{dev.email}</td>
                <td className="px-4 py-3 font-mono text-mgs-text-dim">{dev.jiraAccountId || '—'}</td>
                <td className="px-4 py-3 font-mono text-mgs-text-dim">{dev.slackId || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(dev)}
                    className="mr-2 text-mgs-blue transition-colors hover:text-mgs-blue-light"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(dev)}
                    className="text-mgs-red transition-colors hover:text-mgs-red-light"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {developers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-mgs-text-dim">
                  No developers yet
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
        title={editing ? 'Edit Developer' : 'Add Developer'}
      >
        <DeveloperForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Developer"
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
