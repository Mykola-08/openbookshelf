import { fetchOPDSFeed } from "@/lib/connectors/opds";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ImportBookButton } from "@/components/ImportBookButton";

export const dynamic = 'force-dynamic';

export default async function BrowseCatalog({ searchParams }: { searchParams: Promise<{ url: string }> }) {
  const { url } = await searchParams;

  if (!url) {
    return <div>No OPDS URL provided.</div>;
  }

  let feed;
  let errorMessage = '';

  try {
    feed = await fetchOPDSFeed(url);
  } catch (error: any) {
    errorMessage = error.message || 'Unknown error';
  }

  if (errorMessage || !feed) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading catalog</h2>
        <p className="text-gray-700 bg-red-50 p-4 rounded-md font-mono text-sm break-all">
          {errorMessage}
        </p>
        <Button className="mt-6" asChild>
          <Link href="/discover">Back to Discover</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/discover">
               <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{feed.title || "Catalog"}</h1>
            <p className="text-sm text-gray-500 font-mono mt-1 truncate max-w-xl">{url}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {feed.entries.map((entry) => {
            // Find image link
            const imageLink = entry.links.find(l => (l.type?.startsWith('image/') && l.rel?.includes('thumbnail')) || l.rel?.includes('image'));
            const epubLink = entry.links.find(l => l.type === 'application/epub+zip');
            const opdsNav = entry.links.find(l => l.type?.includes('application/atom+xml;profile=opds-catalog;kind=navigation'));

            return (
              <Card key={entry.id} className="overflow-hidden flex flex-col group">
                <div className="aspect-[2/3] bg-gray-100 relative flex items-center justify-center p-4">
                  {imageLink ? (
                    <Image 
                      src={imageLink.href} 
                      alt={entry.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <CardContent className="p-3 flex-1 flex flex-col pt-4">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1" title={entry.title}>
                    {entry.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-3">
                    {entry.authors.map(a => a.name).join(', ') || 'Unknown Author'}
                  </p>
                  
                  <div className="mt-auto space-y-2">
                     {epubLink && (
                       <ImportBookButton entry={entry} />
                     )}
                     {opdsNav && (
                        <Button size="sm" variant="secondary" className="w-full text-xs" asChild>
                           <Link href={"/discover/browse?url=${encodeURIComponent(opdsNav.href)}"}>
                              Browse
                           </Link>
                        </Button>
                     )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
