import { createClient } from "@/utils/supabase/server";
import { fetchOPDSFeed } from "@/lib/connectors/opds";
import { RemoteBookItem } from "@/components/connections/RemoteBookItem";
import { ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BrowseProps {
  params: { id: string };
  searchParams: { url?: string };
}

export default async function BrowsePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ url?: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  const { url } = await searchParams; // searchParams is also async in Next 15+

  // 1. Fetch Source
  const { data: source, error } = await supabase
    .from('user_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (!source) {
    return <div>Source not found</div>;
  }

  // 2. Determine URL to fetch (Initial or Next Page)
  const feedUrl = url || (source.config as any)?.url;

  if (!feedUrl) {
      return <div>No URL configured for this source.</div>;
  }

  // 3. Fetch OPDS
  let feed = null;
  let fetchError = null;
  try {
      feed = await fetchOPDSFeed(feedUrl);
  } catch (e: any) {
      fetchError = e.message;
  }

  return (
    <div className="min-h-screen bg-background p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link href="/connections" className="p-2 -ml-2 rounded-full hover:bg-accent text-muted-foreground" aria-label="Back to connections">
               <ArrowLeft className="w-5 h-5" />
             </Link>
             <div>
               <h1 className="text-2xl font-bold text-foreground">{source.name}</h1>
               <p className="text-sm text-muted-foreground flex items-center gap-2">
                 {feedUrl}
               </p>
             </div>
           </div>
        </div>

        {fetchError ? (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg">
                <h3 className="font-bold">Error fetching feed</h3>
                <p>{fetchError}</p>
                <p className="text-xs opacity-70 mt-2">Check the URL or try using a proxy/CORS gateway if accessing from browser (but this is server-side).</p>
            </div>
        ) : (
            <>
              {feed?.title && <h2 className="text-lg font-semibold mb-4 text-foreground border-b border-border pb-2">{feed.title}</h2>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feed?.entries.map((entry) => (
                    <RemoteBookItem key={entry.id} entry={entry} sourceId={id} />
                ))}
              </div>

              {/* Pagination */}
              {feed?.nextPage && (
                  <div className="mt-8 flex justify-center">
                      <Link 
                        href={`/connections/${id}/browse?url=${encodeURIComponent(feed.nextPage)}`}
                        className="px-6 py-2 bg-card border border-border rounded-full shadow-sm hover:bg-accent text-foreground font-medium flex items-center gap-2"
                      >
                          Next Page <ChevronRight className="w-4 h-4" />
                      </Link>
                  </div>
              )}
            </>
        )}
      </div>
    </div>
  );
}
