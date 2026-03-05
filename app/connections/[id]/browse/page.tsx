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
    <div className="min-h-screen bg-gray-50 p-8 pt-24 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link href="/connections" className="p-2 -ml-2 rounded-full hover:bg-gray-200 text-gray-500">
               <ArrowLeft className="w-5 h-5" />
             </Link>
             <div>
               <h1 className="text-2xl font-bold text-gray-900">{source.name}</h1>
               <p className="text-sm text-gray-500 flex items-center gap-2">
                 {feedUrl}
               </p>
             </div>
           </div>
        </div>

        {fetchError ? (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                <h3 className="font-bold">Error fetching feed</h3>
                <p>{fetchError}</p>
                <p className="text-xs text-red-600 mt-2">Check the URL or try using a proxy/CORS gateway if accessing from browser (but this is server-side).</p>
            </div>
        ) : (
            <>
              {feed?.title && <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-2">{feed.title}</h2>}
              
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
                        className="px-6 py-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
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
