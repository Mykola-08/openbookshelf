import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Layers as ListHeart, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const dynamic = 'force-dynamic';

export default async function SeriesPage(props: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const searchQuery = searchParams.q || '';
  const sortBy = searchParams.sort || 'name';

  let query = supabase
    .from('series')
    .select(`
      id,
      name,
      slug,
      book_series (count)
    `);

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  query = query.order('name', { ascending: true });

  const { data: series, error } = await query;

  if (error || !series) {
    return <div className="p-8">Found no series or an error occurred.</div>;
  }

  let sortedSeries = [...series];
  if (sortBy === 'books') {
    sortedSeries.sort((a: any, b: any) => (b.book_series[0]?.count || 0) - (a.book_series[0]?.count || 0));
  }

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Series</h1>
          <Badge variant="secondary" className="text-xs">{sortedSeries.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <form className="relative" action="/series" method="get">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search series..."
              className="pl-9 w-56 h-9"
            />
            {sortBy !== 'name' && <input type="hidden" name="sort" value={sortBy} />}
          </form>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link
              href={`/series?${searchQuery ? `q=${encodeURIComponent(searchQuery)}&` : ''}sort=name`}
              className={`px-2 py-1 rounded-md transition-colors ${sortBy === 'name' ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'}`}
            >
              A-Z
            </Link>
            <Link
              href={`/series?${searchQuery ? `q=${encodeURIComponent(searchQuery)}&` : ''}sort=books`}
              className={`px-2 py-1 rounded-md transition-colors ${sortBy === 'books' ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'}`}
            >
              Most Books
            </Link>
          </div>
        </div>
      </div>

      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Showing results for &ldquo;{searchQuery}&rdquo;
          <Link href="/series" className="ml-2 text-primary hover:underline">Clear</Link>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sortedSeries.map((s: any) => {
          const bookCount = s.book_series[0]?.count || 0;
          return (
            <Link href={`/series/${s.slug || s.id}`} key={s.id}>
               <Card className="hover:shadow-md transition-all h-full group focus-within:ring-2 focus-within:ring-primary/50">
                 <CardHeader className="flex flex-row items-center gap-4 pb-2">
                   <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                     <ListHeart className="w-5 h-5 text-primary" />
                   </div>
                   <div className="min-w-0">
                     <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">{s.name}</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <p className="text-xs text-muted-foreground pl-14">
                     {bookCount} {bookCount === 1 ? 'book' : 'books'} in series
                   </p>
                 </CardContent>
               </Card>
            </Link>
          );
        })}
        {sortedSeries.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {searchQuery
              ? `No series matching "${searchQuery}". Try a different search.`
              : 'No series found.'}
          </div>
        )}
      </div>
    </main>
  );
}
