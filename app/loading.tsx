import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar skeleton */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        </aside>

        {/* Content skeleton */}
        <main className="flex-1 min-w-0">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <Skeleton className="h-9 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
