export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-mgs-border/40 ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-mgs-border bg-mgs-card p-4">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="mb-1 h-7 w-24" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-mgs-border bg-mgs-card-alt p-6">
      <div className="mb-5 flex items-center justify-between">
        <Skeleton className="h-3 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-[340px] w-full" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="rounded-xl border border-mgs-border bg-mgs-card-alt overflow-hidden">
      <div className="p-[18px_20px_0]">
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="mt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-mgs-border-dark px-4 py-2.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
