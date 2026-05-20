/**
 * Skeleton loaders — premium shimmer placeholders
 * Used everywhere in place of spinners for perceived performance.
 */

/** Skeleton for table rows */
export default function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div className="animate-fade-in w-full">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={`h-3.5 rounded-lg shimmer ${c === 0 ? 'w-8 h-8 rounded-full flex-shrink-0' : c === 1 ? 'w-36' : c === cols - 1 ? 'w-16' : 'flex-1'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton for KPI / stat cards */
export function SkeletonCard({ count = 4 }) {
  return (
    <div className="responsive-grid grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="clinical-card p-6 space-y-3">
          <div className="h-3 w-20 rounded-full shimmer" />
          <div className="h-8 w-16 rounded-lg shimmer" />
          <div className="h-3 w-24 rounded-full shimmer" />
        </div>
      ))}
    </div>
  );
}

/** Single skeleton block — generic */
export function SkeletonBlock({ className = 'h-4 w-full' }) {
  return <div className={`rounded-lg shimmer ${className}`} />;
}
