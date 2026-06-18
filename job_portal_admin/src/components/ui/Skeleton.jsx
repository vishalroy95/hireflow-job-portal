export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-700 rounded-lg ${className}`} />
  )
}

export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(columns)].map((_, j) => (
            <Skeleton key={j} className="flex-1 h-12" />
          ))}
        </div>
      ))}
    </div>
  )
}
