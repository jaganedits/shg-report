/**
 * Full-page skeleton shown while Firebase auth is loading.
 * Matches the real MainLayout: dark terracotta header + nav + content.
 */
export default function AppSkeleton() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header skeleton — matches terracotta-deep bg */}
      <header className="relative overflow-hidden bg-terracotta-deep text-cream grain">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-brass/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-terracotta-light/15 rounded-full blur-2xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-3 md:px-5 py-2 md:py-3 animate-pulse">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-12 rounded bg-cream/10 shrink-0 hidden md:block" />
              <div>
                <div className="h-5 bg-cream/20 rounded w-52 mb-2" />
                <div className="h-2.5 bg-cream/10 rounded w-36" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-18 h-8 bg-cream/10 border border-cream/15 rounded-lg hidden md:block" style={{ width: 72 }} />
              <div className="w-9 h-9 rounded-full bg-cream/15" />
              <div className="w-18 h-8 bg-cream/10 border border-cream/15 rounded-lg" style={{ width: 72 }} />
            </div>
          </div>
        </div>
        <div className="kolam-border" />
      </header>

      {/* Nav skeleton — desktop */}
      <nav className="hidden md:block sticky top-0 z-20 bg-ivory/80 backdrop-blur-md border-b border-sand">
        <div className="max-w-7xl mx-auto px-5 animate-pulse">
          <div className="flex items-center gap-1 py-1.5">
            {[72, 80, 64, 56, 88, 72, 60].map((w, i) => (
              <div key={i} className="h-8 bg-sand/40 rounded-lg" style={{ width: w }} />
            ))}
          </div>
        </div>
      </nav>

      {/* Content skeleton */}
      <main className="max-w-7xl mx-auto px-3 md:px-5 py-4 md:py-5 w-full flex-1 pb-20 md:pb-5">
        {/* Page title */}
        <div className="mb-5 animate-pulse">
          <div className="h-5 bg-sand/60 rounded w-44 mb-2" />
          <div className="h-3 bg-sand/40 rounded w-60" />
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3 mb-5 animate-pulse">
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

        {/* Chart + Activity cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 animate-pulse">
          <div className="lg:col-span-3 bg-ivory border border-sand rounded-xl overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-sand/60">
              <div className="h-4 bg-sand/50 rounded w-40" />
            </div>
            <div className="p-4">
              <div className="flex items-end gap-2 h-[180px]">
                {[55, 70, 40, 85, 60, 50, 75, 35, 80, 65, 45, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-sand/30 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-ivory border border-sand rounded-xl overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-sand/60">
              <div className="h-4 bg-sand/50 rounded w-32" />
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sand/40" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-sand/40 rounded w-3/4" />
                    <div className="h-2 bg-sand/30 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom nav skeleton */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ivory/95 backdrop-blur-md border-t border-sand">
        <div className="flex items-center justify-around px-1 py-1.5 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-5 h-5 rounded bg-sand/50" />
              <div className="h-1.5 bg-sand/35 rounded w-8" />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
