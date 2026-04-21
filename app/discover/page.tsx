import Link from "next/link";
import { Suspense } from "react";
import { Compass, Globe, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import { getDiscoverFeed } from "@/app/actions/discover";
import { DiscoverFeed, FeedSkeleton } from "@/components/DiscoverFeed";

export const dynamic = 'force-dynamic';

const OPDS_CATALOGS = [
  {
    id: "gutenberg",
    name: "Project Gutenberg",
    description: "Over 70,000 free eBooks — the oldest digital library of public domain works.",
    url: "https://m.gutenberg.org/ebooks.opds/",
    bookCount: "70,000+",
  },
  {
    id: "standardebooks",
    name: "Standard Ebooks",
    description: "High-quality, carefully formatted open source eBooks.",
    url: "https://standardebooks.org/opds/all",
    bookCount: "900+",
  },
  {
    id: "feedbooks",
    name: "Feedbooks",
    description: "Public domain books formatted for mobile devices.",
    url: "https://catalog.feedbooks.com/publicdomain/catalog.atom",
    bookCount: "5,000+",
  },
];

async function FeedContent() {
  const sections = await getDiscoverFeed();
  return <DiscoverFeed initialSections={sections} />;
}

export default function DiscoverPage() {
  return (
    <PageShell width="wide" className="space-y-8">
        <PageHeader
          icon={Compass}
          title="Discover"
          description="Personalized recommendations and trending books from across the web."
          actions={
            <Button variant="ghost" size="sm" className="rounded-lg text-xs text-muted-foreground gap-1.5 h-8" asChild>
              <Link href="/connections/add">
                <Plus className="w-3.5 h-3.5" /> Add Source
              </Link>
            </Button>
          }
        />

        {/* Personalized feed */}
        <Suspense fallback={<FeedSkeleton />}>
          <FeedContent />
        </Suspense>

        {/* OPDS Catalogs — collapsed section */}
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Globe className="w-4 h-4" />
            <span className="font-medium">Browse OPDS Catalogs</span>
            <Badge variant="secondary" className="text-[10px] rounded-full px-2">{OPDS_CATALOGS.length}</Badge>
            <svg className="w-3 h-3 ml-auto transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 pb-4">
            {OPDS_CATALOGS.map((catalog) => (
              <Card key={catalog.id} className="hover:shadow-md transition-all flex flex-col rounded-xl bg-card/50 border border-border/40 group/card">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted/50 rounded-lg border border-border/20">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm tracking-tight">{catalog.name}</CardTitle>
                      <span className="text-[10px] text-muted-foreground">{catalog.bookCount} books</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{catalog.description}</p>
                  <Button size="sm" className="w-full rounded-lg h-8 text-xs" asChild>
                    <Link href={`/discover/browse?url=${encodeURIComponent(catalog.url)}`}>
                      Browse Catalog
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center pb-2">
            <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1.5" asChild>
              <Link href="/connections/add">
                <ExternalLink className="w-3 h-3" /> Add Custom OPDS Source
              </Link>
            </Button>
          </div>
        </details>
    </PageShell>
  );
}
