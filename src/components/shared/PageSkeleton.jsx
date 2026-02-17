export function CardSkeleton({ rows = 3, columns = 4 }) {
  return (
    <div className="bg-ivory border border-sand rounded-xl overflow-hidden animate-pulse">
      {/* Card header */}
      <div className="px-4 pt-3 pb-2 border-b border-sand/60 flex items-center justify-between">
        <div className="h-4 bg-sand/60 rounded w-36" />
        <div className="h-7 bg-sand/50 rounded-lg w-16" />
      </div>
      {/* Table header */}
      <div className="px-4 pt-3 pb-2 bg-cream-dark/30 flex items-center gap-4">
        {Array.from({ length: columns }).map((_, c) => (
          <div key={c} className={`h-3 bg-sand/50 rounded ${c === 0 ? 'w-6' : c === 1 ? 'w-28' : 'w-16'}`} />
        ))}
      </div>
      {/* Table rows */}
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className={`h-3 rounded ${c === 0 ? 'w-6 bg-sand/40' : c === 1 ? 'w-28 bg-sand/50' : 'w-16 bg-sand/40'}`}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Footer row */}
      <div className="px-4 py-2.5 bg-cream-dark/20 border-t border-sand/40 flex items-center gap-4">
        <div className="h-3.5 bg-sand/50 rounded w-16" />
        {Array.from({ length: Math.min(columns - 1, 5) }).map((_, c) => (
          <div key={c} className="h-3 bg-sand/45 rounded w-16" />
        ))}
      </div>
    </div>
  );
}

export function MetricsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-ivory border border-sand rounded-xl p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-sand/50" />
            <div className="h-2.5 bg-sand/45 rounded w-16" />
          </div>
          <div className="h-5 bg-sand/60 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-ivory border border-sand rounded-xl overflow-hidden animate-pulse">
      <div className="px-4 pt-3 pb-2 border-b border-sand/60">
        <div className="h-4 bg-sand/55 rounded w-44" />
      </div>
      <div className="p-4">
        <div className="flex items-end gap-2 h-[180px]">
          {[60, 80, 45, 90, 70, 55, 85, 40, 75, 65, 50, 72].map((h, i) => (
            <div key={i} className="flex-1 bg-sand/35 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PageSkeleton({ type = 'table' }) {
  if (type === 'dashboard') {
    return (
      <div className="space-y-5">
        <div className="animate-pulse">
          <div className="h-5 bg-sand/55 rounded w-40 mb-2" />
          <div className="h-3 bg-sand/40 rounded w-56" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-ivory border border-sand rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-sand/50" />
                <div className="h-2.5 bg-sand/40 rounded w-14" />
              </div>
              <div className="h-5 bg-sand/60 rounded w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3"><ChartSkeleton /></div>
          <div className="lg:col-span-2"><ChartSkeleton /></div>
        </div>
      </div>
    );
  }

  if (type === 'members') {
    return (
      <div className="space-y-5">
        <div className="animate-pulse">
          <div className="h-5 bg-sand/55 rounded w-32 mb-2" />
          <div className="h-3 bg-sand/40 rounded w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="lg:col-span-3"><CardSkeleton rows={8} columns={6} /></div>
          <div className="lg:col-span-2">
            <div className="bg-ivory border border-sand rounded-xl overflow-hidden animate-pulse">
              <div className="px-4 pt-3 pb-2 border-b border-sand/60">
                <div className="h-4 bg-sand/55 rounded w-28" />
              </div>
              <div className="p-4 flex items-center justify-center h-[260px]">
                <div className="w-48 h-48 rounded-full bg-sand/20 border-[10px] border-sand/15" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: table/data page
  return (
    <div className="space-y-5">
      <div className="animate-pulse">
        <div className="h-5 bg-sand/55 rounded w-36 mb-2" />
        <div className="h-3 bg-sand/40 rounded w-52" />
      </div>
      <MetricsSkeleton count={4} />
      <CardSkeleton rows={6} columns={5} />
    </div>
  );
}
