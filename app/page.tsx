import Link from "next/link";
import { User, Library, Filter, Layers, LayoutGrid, List, ArrowDownWideNarrow } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import BookCard from "@/components/BookCard";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = 'force-dynamic';

export default async function Home(props: {
  searchParams: Promise<{ status?: string; sort?: string; view?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const statusFilter = searchParams.status || 'all';
  const sortOption = searchParams.sort || 'recent';
  const viewMode = searchParams.view || 'grid'; // 'grid' | 'list' | 'dense'

  let query = supabase.from('user_books').select('*, books(*, authors(*))');    
  
  if (user) {
    query = query.eq('user_id', user.id);
  }

  // Apply filters
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  // Apply sorting
  if (sortOption === 'recent') {
    query = query.order('last_read_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  } else if (sortOption === 'progress') {
    query = query.order('progress', { ascending: false, nullsFirst: false });
  } else if (sortOption === 'rating') {
    query = query.order('rating', { ascending: false, nullsFirst: false });
  }

  const { data: userBooks, error } = await query;
  let booksToDisplay = userBooks || [];

  // Client-side JS sorting for nested fields (title, author)
  if (sortOption === 'title') {
    booksToDisplay.sort((a, b) => {
      const titleA = a.books?.title || '';
      const titleB = b.books?.title || '';
      return titleA.localeCompare(titleB);
    });
  } else if (sortOption === 'author') {
    booksToDisplay.sort((a, b) => {
      const authorA = a.books?.authors?.[0]?.name || '';
      const authorB = b.books?.authors?.[0]?.name || '';
      return authorA.localeCompare(authorB);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar / Filters */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-8 md:sticky md:top-24 h-max">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">Status</h3>
            <ul className="space-y-1">
              {[
                { id: 'all', label: 'All Books' },
                { id: 'toread', label: 'To Read' },
                { id: 'reading', label: 'Reading' },
                { id: 'finished', label: 'Finished' },
                { id: 'abandoned', label: 'Abandoned' }
              ].map(st => (
                <li key={st.id}>
                   <Link 
                     href={`/?status=${st.id}&sort=${sortOption}&view=${viewMode}`} 
                     className={`flex justify-between items-center text-sm px-3 py-2 rounded-md ${statusFilter === st.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                   >
                     <span>{st.label}</span>
                   </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">Sort By</h3>
            <ul className="space-y-1">
              {[
                { id: 'recent', label: 'Recently Opened' },
                { id: 'title', label: 'Title (A-Z)' },
                { id: 'author', label: 'Author (A-Z)' },
                { id: 'progress', label: 'Highest Progress' },
                { id: 'rating', label: 'Highest Rated' },
              ].map(st => (
                <li key={st.id}>
                   <Link 
                     href={`/?sort=${st.id}&status=${statusFilter}&view=${viewMode}`} 
                     className={`flex justify-between items-center text-sm px-3 py-2 rounded-md ${sortOption === st.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                   >
                     <span>{st.label}</span>
                   </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
               {statusFilter === 'all' ? 'All Books' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </h1>
            <div className="flex gap-2 bg-secondary p-1 rounded-lg w-max">
               <Link href={`/?view=grid&status=${statusFilter}&sort=${sortOption}`} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                 <LayoutGrid className="w-4 h-4" />
               </Link>
               <Link href={`/?view=list&status=${statusFilter}&sort=${sortOption}`} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                 <List className="w-4 h-4" />
               </Link>
               <Link href={`/?view=dense&status=${statusFilter}&sort=${sortOption}`} className={`p-1.5 rounded-md ${viewMode === 'dense' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                 <Filter className="w-4 h-4" />
               </Link>
            </div>
          </div>

          {!booksToDisplay.length ? (
            <EmptyState 
              icon={Library} 
              title="No books found" 
              description="Your library doesn't have any books matching these criteria. Try adjusting your filters or adding new books." 
              action={
                <Link href="/discover" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4 shadow-sm">
                  Discover Books
                </Link>
              }
            />
          ) : (
            <div className={`
              ${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' : ''}
              ${viewMode === 'list' ? 'space-y-4 flex flex-col' : ''}
              ${viewMode === 'dense' ? 'space-y-2 flex flex-col' : ''}
            `}>
              {booksToDisplay.map((ub: any) => {
                const bookItem = ub.books;
                if (!bookItem) return null;
                
                const mappedBook = {
                  ...bookItem,
                  status: ub.status,
                  progress: ub.progress,
                  rating: ub.rating,
                  authors: bookItem.authors?.map((a: any) => a.name) || ["Unknown Author"]
                };

                if (viewMode === 'dense') {
                  return (
                    <Link key={ub.id} href={`/book/${bookItem.id}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4 truncate">
                         <span className="font-medium truncate">{mappedBook.title}</span>
                         <span className="text-sm text-muted-foreground hidden sm:inline-block truncate">{mappedBook.authors[0]}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                         {mappedBook.rating && <span>★ {mappedBook.rating}</span>}
                         {mappedBook.progress !== undefined && <span>{mappedBook.progress}%</span>}
                         <span className="w-20 text-right capitalize">{mappedBook.status}</span>
                      </div>
                    </Link>
                  );
                }

                if (viewMode === 'list') {
                  return (
                    <div key={ub.id} className="flex gap-4 border p-4 rounded-xl hover:bg-muted/20 transition-colors">
                       <Link href={`/book/${bookItem.id}`} className="w-20 h-28 bg-muted rounded overflow-hidden shrink-0 shadow-sm transition-transform hover:scale-105 duration-300 relative group">
                          {mappedBook.coverUrl ? (
                            <img src={mappedBook.coverUrl} alt={mappedBook.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Cover</div>
                          )}
                       </Link>
                       <div className="flex flex-col flex-1 min-w-0">
                          <Link href={`/book/${bookItem.id}`} className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1 truncate">{mappedBook.title}</Link>
                          <p className="text-muted-foreground text-sm mb-2">{mappedBook.authors.join(', ')}</p>
                          <div className="mt-auto flex items-center gap-4 text-sm">
                             <span className="bg-secondary px-2 py-1 rounded-md capitalize font-medium">{mappedBook.status}</span>
                             {mappedBook.rating && <span className="flex items-center gap-1 text-amber-500">★ {mappedBook.rating}</span>}
                          </div>
                          {mappedBook.status === 'reading' && mappedBook.progress !== undefined && (
                            <div className="mt-3 w-full max-w-md bg-secondary rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(mappedBook.progress, 100)}%` }}></div>
                            </div>
                          )}
                       </div>
                    </div>
                  );
                }

                // Grid mode
                return (
                  <Link key={ub.id} href={`/book/${bookItem.id}`} className="block">
                    <BookCard book={mappedBook} />
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
