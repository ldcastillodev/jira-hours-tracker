import { useApi } from '../hooks/useApi';
import { Header } from '../components/layout/Header';
import { DeveloperPanel } from '../components/manage/DeveloperPanel';
import { ProjectPanel } from '../components/manage/ProjectPanel';
import { ComponentPanel } from '../components/manage/ComponentPanel';
import { TableSkeleton } from '../components/ui/Skeleton';

interface Developer {
  id: number;
  name: string;
  email: string;
  jiraAccountId: string;
  slackId: string | null;
}

interface Project {
  id: number;
  name: string;
  monthlyBudget: number;
  components?: { id: number; name: string; isBillable: boolean }[];
}

export function Manage() {
  const devs = useApi<Developer[]>('/developers');
  const projs = useApi<Project[]>('/projects');

  // Flatten components from all projects
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
        badge="CRUD"
      />

      <div className="space-y-10">
        {/* Developers */}
        {devs.loading ? (
          <TableSkeleton />
        ) : devs.error ? (
          <ErrorBlock message={devs.error} />
        ) : (
          <DeveloperPanel developers={devs.data!} onRefresh={devs.refetch} />
        )}

        {/* Projects */}
        {projs.loading ? (
          <TableSkeleton />
        ) : projs.error ? (
          <ErrorBlock message={projs.error} />
        ) : (
          <>
            <ProjectPanel projects={projs.data!} onRefresh={projs.refetch} />
            <ComponentPanel
              components={allComponents}
              projects={projs.data!}
              onRefresh={projs.refetch}
            />
          </>
        )}
      </div>
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
