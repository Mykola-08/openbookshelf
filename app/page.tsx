import Link from "next/link";
import { cookies } from "next/headers";
import { User, Library, Filter, Layers, LayoutGrid, List, ArrowDownWideNarrow, BookOpen } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import BookCard from "@/components/BookCard";
import { EmptyState } from "@/components/ui/empty-state";
import MatchingInbox from "@/components/MatchingInbox";
import { LibraryClientShell } from "@/components/LibraryClientShell";
import { SelectableBookWrapper } from "@/components/SelectableBookWrapper";
import { LibraryToolbar } from "@/components/LibraryToolbar";
import { USER_SETTINGS_COOKIE_NAME, parseUserSettings } from "@/lib/config/user-settings";

export const dynamic = 'force-dynamic';

export default async function Home(props: {
  searchParams: Promise<{ status?: string; sort?: string; view?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const cookieStore = await cookies();
  const userSettings = parseUserSettings(cookieStore.get(USER_SETTINGS_COOKIE_NAME)?.value ? decodeURIComponent(cookieStore.get(USER_SETTINGS_COOKIE_NAME)!.value) : null);
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

  const { data: pendingSources } = await supabase
    .from('source_items')
    .select('*, user_sources(*)')
    .in('sync_state', ['pending_create', 'conflict'])
    .limit(10);
    
  const pendingInboxItems = (pendingSources || []).map((item: any) => ({
    id: item.id,
    sourceBook: {
      title: item.last_synced_data?.title || item.remote_id,
      author: item.last_synced_data?.author || "Unknown",
      cover: item.last_synced_data?.cover_url,
      sourceName: item.user_sources?.name || 'Unknown Source'
    },
    confidence: item.sync_state === 'conflict' ? 50 : 90
  }));


  // Client-side JS sorting for nested fields (title, author)
  if (sortOption === 'title') {
    booksToDisplay.sort((a: any, b: any) => {
      const titleA = a.books?.title || '';
      const titleB = b.books?.title || '';
      return titleA.localeCompare(titleB);
    });
  } else if (sortOption === 'author') {
    booksToDisplay.sort((a: any, b: any) => {
      const authorA = a.books?.authors?.[0]?.name || '';
      const authorB = b.books?.authors?.[0]?.name || '';
      return authorA.localeCompare(authorB);
    });
  }

  const allUserBookIds = booksToDisplay.map((ub: any) => ub.id);

  return (
    <LibraryClientShell allUserBookIds={allUserBookIds}>
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* Sidebar / Filters — styled as a card on desktop, collapsible on mobile */}
        <aside className="w-full md:w-56 lg:w-60 flex-shrink-0 md:sticky md:top-20 h-max">
          <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-6 shadow-sm">
            <div>
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">Status</h3>
              <ul className="space-y-0.5">
                {[
                  { id: 'all', label: 'All Books', count: booksToDisplay.length },
                  { id: 'toread', label: 'To Read' },
                  { id: 'reading', label: 'Reading' },
                  { id: 'finished', label: 'Finished' },
                  { id: 'abandoned', label: 'Abandoned' }
                ].map(st => (
                  <li key={st.id}>
                    <Link 
                      href={`/?status=${st.id}&sort=${sortOption}&view=${viewMode}`} 
                      className={`flex items-center justify-between text-[13px] px-2.5 py-1.5 rounded-lg transition-colors ${
                        statusFilter === st.id 
                          ? 'bg-foreground/[0.06] text-foreground font-medium' 
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <span>{st.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="h-px bg-border/50" />
            
            <div>
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">Sort By</h3>
              <ul className="space-y-0.5">
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
                      className={`flex items-center text-[13px] px-2.5 py-1.5 rounded-lg transition-colors ${
                        sortOption === st.id 
                          ? 'bg-foreground/[0.06] text-foreground font-medium' 
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <span>{st.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {statusFilter === 'all' ? 'Library' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {booksToDisplay.length} {booksToDisplay.length === 1 ? 'book' : 'books'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border/40">
                 <Link href={`/?view=grid&status=${statusFilter}&sort=${sortOption}`} aria-label="Grid view" className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                   <LayoutGrid className="w-3.5 h-3.5" />
                 </Link>
                 <Link href={`/?view=list&status=${statusFilter}&sort=${sortOption}`} aria-label="List view" className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                   <List className="w-3.5 h-3.5" />
                 </Link>
                 <Link href={`/?view=dense&status=${statusFilter}&sort=${sortOption}`} aria-label="Dense view" className={`p-1.5 rounded-md transition-colors ${viewMode === 'dense' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                   <Filter className="w-3.5 h-3.5" />
                 </Link>
              </div>
              <LibraryToolbar />
            </div>
          </div>

          {userSettings.enableMatchingInbox && pendingInboxItems.length > 0 && <MatchingInbox pendingMatches={pendingInboxItems} />}

          {!booksToDisplay.length ? (
            <EmptyState 
              icon={Library} 
              title="No books yet" 
              description="Your library is waiting. Add books from the Discover page or import from a connected source." 
              action={
                <Link href="/discover" className="inline-flex items-center gap-2 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors h-9 px-4 shadow-sm">
                  <BookOpen className="w-4 h-4" />
                  Discover Books
                </Link>
              }
            />
          ) : (
            <div className={`
              ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5' : ''}
              ${viewMode === 'list' ? 'space-y-3 flex flex-col' : ''}
              ${viewMode === 'dense' ? 'space-y-1 flex flex-col' : ''}
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
                    <SelectableBookWrapper key={ub.id} userBookId={ub.id}>
                      <Link href={`/book/${bookItem.id}`} className="flex items-center justify-between px-3 py-2.5 border border-border/40 rounded-lg hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3 truncate">
                           <span className="font-medium text-sm truncate group-hover:text-foreground">{mappedBook.title}</span>
                           <span className="text-xs text-muted-foreground hidden sm:inline-block truncate">{mappedBook.authors[0]}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                           {mappedBook.rating && <span className="text-primary">★ {mappedBook.rating}</span>}
                           {mappedBook.progress !== undefined && <span className="tabular-nums">{mappedBook.progress}%</span>}
                           <span className="w-16 text-right capitalize text-[11px] font-medium bg-muted/50 px-1.5 py-0.5 rounded">{mappedBook.status}</span>
                        </div>
                      </Link>
                    </SelectableBookWrapper>
                  );
                }

                if (viewMode === 'list') {
                  return (
                    <SelectableBookWrapper key={ub.id} userBookId={ub.id}>
                    <div className="flex gap-4 border border-border/40 p-3.5 rounded-xl hover:bg-muted/20 transition-colors group">
                       <Link href={`/book/${bookItem.id}`} className="w-16 h-24 bg-muted rounded-lg overflow-hidden shrink-0 shadow-sm transition-transform group-hover:scale-[1.02] relative">
                          {mappedBook.coverUrl ? (
                            <img src={mappedBook.coverUrl} alt={mappedBook.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <BookOpen className="w-5 h-5 opacity-50" />
                            </div>
                          )}
                       </Link>
                       <div className="flex flex-col flex-1 min-w-0 py-0.5">
                          <Link href={`/book/${bookItem.id}`} className="font-medium text-[15px] hover:text-foreground transition-colors line-clamp-1">{mappedBook.title}</Link>
                          <p className="text-muted-foreground text-xs mt-0.5">{mappedBook.authors.join(', ')}</p>
                          <div className="mt-auto flex items-center gap-3 text-xs">
                             <span className="bg-muted/60 px-2 py-0.5 rounded capitalize font-medium text-[11px]">{mappedBook.status}</span>
                             {mappedBook.rating && <span className="text-primary">★ {mappedBook.rating}</span>}
                          </div>
                          {mappedBook.status === 'reading' && mappedBook.progress !== undefined && (
                            <div className="mt-2 w-full max-w-xs bg-muted/50 rounded-full h-1 overflow-hidden">
                              <div className="bg-foreground/60 h-full rounded-full transition-all" style={{ width: `${Math.min(mappedBook.progress, 100)}%` }}></div>
                            </div>
                          )}
                       </div>
                    </div>
                    </SelectableBookWrapper>
                  );
                }

                // Grid mode
                return (
                  <SelectableBookWrapper key={ub.id} userBookId={ub.id}>
                    <Link href={`/book/${bookItem.id}`} className="block">
                      <BookCard book={mappedBook} />
                    </Link>
                  </SelectableBookWrapper>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
    </LibraryClientShell>
  );
}
