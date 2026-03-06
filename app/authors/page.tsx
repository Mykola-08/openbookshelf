import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { User, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const dynamic = 'force-dynamic';

export default async function AuthorsPage(props: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const searchQuery = searchParams.q || '';
  const sortBy = searchParams.sort || 'name';

  // Fetch authors and their book count
  let query = supabase
    .from('authors')
    .select(`
      id,
      name,
      slug,
      photo_url,
      book_authors (count)
    `);

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  if (sortBy === 'name') {
    query = query.order('name', { ascending: true });
  } else {
    query = query.order('name', { ascending: true });
  }

  const { data: authors, error } = await query;

  if (error || !authors) {
    return <div className="p-8">Found no authors or an error occurred.</div>;
  }

  // Sort by book count client-side if requested
  let sortedAuthors = [...authors];
  if (sortBy === 'books') {
    sortedAuthors.sort((a: any, b: any) => (b.book_authors[0]?.count || 0) - (a.book_authors[0]?.count || 0));
  }

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Authors</h1>
          <Badge variant="secondary" className="text-xs">{sortedAuthors.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <form className="relative" action="/authors" method="get">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={searchQuery}
              placeholder="Search authors..."
              className="pl-9 w-56 h-9"
            />
            {sortBy !== 'name' && <input type="hidden" name="sort" value={sortBy} />}
          </form>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link
              href={`/authors?${searchQuery ? `q=${encodeURIComponent(searchQuery)}&` : ''}sort=name`}
              className={`px-2 py-1 rounded-md transition-colors ${sortBy === 'name' ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'}`}
            >
              A-Z
            </Link>
            <Link
              href={`/authors?${searchQuery ? `q=${encodeURIComponent(searchQuery)}&` : ''}sort=books`}
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
          <Link href="/authors" className="ml-2 text-primary hover:underline">Clear</Link>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedAuthors.map((author: any) => {
          const bookCount = author.book_authors[0]?.count || 0;
          return (
            <Link href={`/authors/${author.slug || author.id}`} key={author.id}>
               <Card className="hover:shadow-md transition-all h-full group focus-within:ring-2 focus-within:ring-primary/50">
                 <CardHeader className="flex flex-row items-center gap-4 pb-2">
                   <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-border group-hover:border-primary/50 transition-colors">
                     {author.photo_url ? (
                        <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
                     ) : (
                        <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                     )}
                   </div>
                   <div className="min-w-0">
                     <CardTitle className="text-base group-hover:text-primary transition-colors truncate">{author.name}</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <p className="text-xs text-muted-foreground">
                     {bookCount} {bookCount === 1 ? 'book' : 'books'}
                   </p>
                 </CardContent>
               </Card>
            </Link>
          );
        })}
        {sortedAuthors.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {searchQuery
              ? `No authors matching "${searchQuery}". Try a different search.`
              : 'No authors found. Import some books to see them here!'}
          </div>
        )}
      </div>
    </main>
  );
}
