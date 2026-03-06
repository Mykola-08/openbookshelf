import { Skeleton } from "@/components/ui/skeleton";

export default function AuthorsLoading() {
  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>
        <Skeleton className="h-9 w-56" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </main>
  );
}
