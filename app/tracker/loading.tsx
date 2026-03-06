import { Skeleton } from "@/components/ui/skeleton";

export default function TrackerLoading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex items-end justify-between border-b pb-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, col) => (
            <div key={col} className="space-y-4">
              <Skeleton className="h-6 w-28" />
              {Array.from({ length: 3 }).map((_, row) => (
                <div key={row} className="p-4 border rounded-xl space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="w-12 h-16 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
