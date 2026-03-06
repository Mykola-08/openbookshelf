import { fetchOPDSFeed } from "@/lib/connectors/opds";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, BookOpen, Library, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ImportBookButton } from "@/components/ImportBookButton";

export const dynamic = 'force-dynamic';

function CoverImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <BookOpen className="w-12 h-12 text-muted-foreground/20" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
      loading="lazy"
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        const fallback = target.nextElementSibling;
        if (fallback) (fallback as HTMLElement).style.display = 'flex';
      }}
    />
  );
}

export default async function BrowseCatalog({ searchParams }: { searchParams: Promise<{ url: string }> }) {
  const { url } = await searchParams;

  if (!url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Library className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">No OPDS URL provided.</p>
          <Button asChild><Link href="/discover">Back to Discover</Link></Button>
        </div>
      </div>
    );
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
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Error loading catalog</h2>
          <p className="text-sm text-muted-foreground bg-destructive/5 p-4 rounded-xl border border-destructive/20 font-mono break-all">
            {errorMessage}
          </p>
          <Button asChild>
            <Link href="/discover">Back to Discover</Link>
          </Button>
        </div>
      </div>
    );
  }

  const entryCount = feed.entries.length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" className="rounded-xl shrink-0" asChild>
            <Link href="/discover">
               <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">{feed.title || "Catalog"}</h1>
              <Badge variant="secondary" className="rounded-full">{entryCount} items</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-1 truncate max-w-xl">{url}</p>
          </div>
        </div>

        {/* Search link if the feed supports it */}
        {feed.searchLink && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-xl p-3 border">
            <Search className="w-4 h-4" />
            <span>This catalog supports search.</span>
            <a href={feed.searchLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              Open search description
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {feed.entries.map((entry) => {
            const imageLink = entry.links.find(l => (l.type?.startsWith('image/') && l.rel?.includes('thumbnail')) || l.rel?.includes('image'));
            const epubLink = entry.links.find(l => l.type === 'application/epub+zip');
            const opdsNav = entry.links.find(l =>
              l.type?.includes('application/atom+xml') &&
              (l.rel?.includes('subsection') || l.type?.includes('kind=navigation') || l.type?.includes('kind=acquisition'))
            );
            const categories = entry.category?.map(c => c.label || c.term).filter(Boolean).slice(0, 2);

            return (
              <Card key={entry.id} className="overflow-hidden flex flex-col group rounded-xl border-border/60 bg-card hover:shadow-md transition-all">
                <div className="aspect-[2/3] bg-muted relative flex items-center justify-center">
                  <CoverImage src={imageLink?.href} alt={entry.title} />
                  {/* Hidden fallback shown by onError */}
                  <div className="absolute inset-0 items-center justify-center bg-muted hidden">
                    <BookOpen className="w-12 h-12 text-muted-foreground/20" />
                  </div>
                </div>
                <CardContent className="p-3 flex-1 flex flex-col pt-3">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 text-foreground" title={entry.title}>
                    {entry.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                    {entry.authors.map(a => a.name).join(', ') || 'Unknown Author'}
                  </p>
                  {categories && categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {categories.map(c => (
                        <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0 rounded-full">{c}</Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-auto space-y-2 pt-1">
                     {epubLink && (
                       <ImportBookButton entry={entry} />
                     )}
                     {opdsNav && (
                        <Button size="sm" variant="secondary" className="w-full text-xs rounded-lg" asChild>
                           <Link href={`/discover/browse?url=${encodeURIComponent(opdsNav.href)}`}>
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

        {/* Pagination */}
        {feed.nextPage && (
          <div className="flex justify-center pt-4 pb-8">
            <Button asChild className="gap-2 rounded-full px-6">
              <Link href={`/discover/browse?url=${encodeURIComponent(feed.nextPage)}`}>
                Next Page <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
