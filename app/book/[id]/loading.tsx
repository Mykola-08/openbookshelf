import { Skeleton } from "@/components/ui/skeleton";

export default function BookDetailLoading() {
  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-background">
      {/* Back nav */}
      <Skeleton className="h-5 w-32" />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover */}
        <Skeleton className="w-48 h-72 rounded-xl shrink-0" />

        {/* Details */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="pt-4 space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
