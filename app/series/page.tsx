import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Layers as ListHeart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function SeriesPage() {
  const supabase = await createClient();

  const { data: series, error } = await supabase
    .from('series')
    .select(`
      id,
      name,
      slug,
      book_series (count)
    `)
    .order('name', { ascending: true });

  if (error || !series) {
    return <div className="p-8">Found no series or an error occurred.</div>;
  }

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-gray-50">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Series</h1>
        <p className="text-gray-500 text-sm mt-1">Collections of books belonging together.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {series.map((s: any) => (
          <Link href={`/series/${s.slug || s.id}`} key={s.id}>
             <Card className="hover:shadow-md transition-all h-full group">
               <CardHeader className="flex flex-row items-center gap-4 pb-2">
                 <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100 group-hover:bg-purple-100 transition-colors">
                   <ListHeart className="w-5 h-5 text-purple-500" />
                 </div>
                 <div>
                   <CardTitle className="text-base group-hover:text-purple-700 transition-colors line-clamp-1">{s.name}</CardTitle>
                 </div>
               </CardHeader>
               <CardContent>
                 <p className="text-xs text-gray-500 pl-14">
                   {s.book_series[0]?.count || 0} books in series
                 </p>
               </CardContent>
             </Card>
          </Link>
        ))}
        {series.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No series found.
          </div>
        )}
      </div>
    </main>
  );
}
