import { useState } from 'react';
import { mutateApi } from '../../../services/api';
import { Modal } from '../../atoms/Modal/Modal';
import { Button } from '../../atoms/Button/Button';
import { TableHeader } from '../../atoms/TableHeader/TableHeader';
import { DeveloperForm } from '../../molecules/DeveloperForm/DeveloperForm';
import { ConfirmDialog } from '../../molecules/ConfirmDialog/ConfirmDialog';
import { showToast } from '../../molecules/Toast/Toast';

interface Developer {
  id: number;
  name: string;
  email: string;
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
        <Button variant="primary" onClick={openCreate}>
          + Add Developer
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-mgs-border bg-mgs-card-alt">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-mgs-border">
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Slack ID</Th>
              <Th className="w-24 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {developers.map((dev) => (
              <tr key={dev.id} className="border-b border-mgs-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-mgs-text">{dev.name}</td>
                <td className="px-4 py-3 text-mgs-text-muted">{dev.email}</td>
                <td className="px-4 py-3 font-mono text-mgs-text-dim">{dev.slackId || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="link-blue"
                    className="mr-2"
                    onClick={() => openEdit(dev)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="link-red"
                    onClick={() => setDeleting(dev)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {developers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-mgs-text-dim">
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
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Developer"
        message={<>Are you sure you want to delete <strong className="text-mgs-text">{deleting?.name}</strong>?</>}
        loading={deleteLoading}
      />
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <TableHeader className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.8px] text-mgs-text-faint ${className}`}>
      {children}
    </TableHeader>
  );
}
