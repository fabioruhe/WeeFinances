export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div className="skeleton-shimmer h-4 w-32 rounded mb-4" />
      <div className="skeleton-shimmer h-8 w-48 rounded mb-2" />
      <div className="skeleton-shimmer h-3 w-24 rounded" />
    </div>
  );
}

export function SkeletonChartCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div className="skeleton-shimmer h-4 w-40 rounded mb-4" />
      <div className="skeleton-shimmer rounded" style={{ height: 200 }} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="skeleton-shimmer h-8 w-56 rounded mb-2" />
      <div className="skeleton-shimmer h-10 w-64 rounded-full mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonChartCard className="sm:col-span-2" />
        <SkeletonChartCard className="sm:col-span-2 xl:col-span-3" />
      </div>
    </div>
  );
}
