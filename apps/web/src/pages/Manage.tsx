import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Header } from '../components/layout/Header';
import { DeveloperPanel } from '../components/manage/DeveloperPanel';
import { ProjectPanel } from '../components/manage/ProjectPanel';
import { ComponentPanel } from '../components/manage/ComponentPanel';
import { TrashPanel } from '../components/manage/TrashPanel';
import { TableSkeleton } from '../components/ui/Skeleton';

interface Developer {
  id: number;
  name: string;
  email: string;
  slackId: string | null;
}

interface Project {
  id: number;
  name: string;
  monthlyBudget: number | null;
  components?: { id: number; name: string; isBillable: boolean }[];
}

type Tab = 'developers' | 'projects' | 'components' | 'trash';

const TABS: { id: Tab; label: string }[] = [
  { id: 'developers', label: 'Developers' },
  { id: 'projects', label: 'Projects' },
  { id: 'components', label: 'Components' },
  { id: 'trash', label: 'Trash' },
];

export function Manage() {
  const [activeTab, setActiveTab] = useState<Tab>('developers');
  const devs = useApi<Developer[]>('/developers');
  const projs = useApi<Project[]>('/projects');

  const allComponents = projs.data
    ? projs.data.flatMap((p) =>
        (p.components ?? []).map((c) => ({ ...c, projectId: p.id })),
      )
    : [];

  return (
    <>
      <Header
        title="Manage"
        subtitle="Manage developers, projects and components"
        badge="Manage"
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-mgs-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-mgs-blue text-mgs-blue'
                : 'text-mgs-text-muted hover:text-mgs-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'developers' && (
        <>
          {devs.loading ? (
            <TableSkeleton />
          ) : devs.error ? (
            <ErrorBlock message={devs.error} />
          ) : (
            <DeveloperPanel developers={devs.data!} onRefresh={devs.refetch} />
          )}
        </>
      )}

      {activeTab === 'projects' && (
        <>
          {projs.loading ? (
            <TableSkeleton />
          ) : projs.error ? (
            <ErrorBlock message={projs.error} />
          ) : (
            <ProjectPanel projects={projs.data!} onRefresh={projs.refetch} />
          )}
        </>
      )}

      {activeTab === 'components' && (
        <>
          {projs.loading ? (
            <TableSkeleton />
          ) : projs.error ? (
            <ErrorBlock message={projs.error} />
          ) : (
            <ComponentPanel
              components={allComponents}
              projects={projs.data!}
              onRefresh={projs.refetch}
            />
          )}
        </>
      )}

      {activeTab === 'trash' && <TrashPanel />}
    </>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-mgs-red/30 bg-mgs-red/10 px-4 py-6 text-center text-xs text-mgs-red-light">
      {message}
    </div>
  );
}

