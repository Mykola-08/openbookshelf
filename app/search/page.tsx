import { Search, BookOpen, Library, Globe, Star, Filter } from "lucide-react";
import Link from "next/link";
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import { globalSearch } from "@/app/actions/search";
import type { SearchFilters, SearchResult } from "@/lib/search/search-engine";

export const dynamic = "force-dynamic";

function SourceIcon({ source }: { source: string }) {
  switch (source) {
    case 'library': return <Library className="w-3 h-3 text-primary" />;
    case 'opds': return <Globe className="w-3 h-3 text-blue-500" />;
    case 'openlibrary': return <BookOpen className="w-3 h-3 text-green-600" />;
    default: return null;
  }
}

function SourceLabel({ source, sourceName }: { source: string; sourceName?: string }) {
  const labels: Record<string, string> = {
    library: 'Your Library',
    opds: sourceName || 'OPDS Catalog',
    openlibrary: 'Open Library',
  };
  return <span className="text-[10px] text-muted-foreground">{labels[source] || source}</span>;
}

function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <div className="group bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
      {/* Cover */}
      <div className="aspect-2/3 bg-muted relative">
        {result.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.coverUrl}
            alt={`Cover of ${result.title}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/50">
            <BookOpen className="w-10 h-10" />
          </div>
        )}

        {/* Source badge */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
          <SourceIcon source={result.source} />
          <SourceLabel source={result.source} sourceName={result.sourceName} />
        </div>

        {/* Rating */}
        {result.rating && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[10px] font-semibold">{result.rating.toFixed(1)}</span>
          </div>
        )}

        {/* In library indicator */}
        {result.inLibrary && (
          <div className="absolute top-1.5 right-1.5 bg-primary/90 rounded-full p-1">
            <Library className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-sm line-clamp-2 leading-snug mb-0.5 text-foreground" title={result.title}>
          {result.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate mb-1.5">
          {result.authors.join(', ') || 'Unknown Author'}
        </p>

        {/* Genres */}
        {result.genres && result.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {result.genres.slice(0, 2).map((g) => (
              <Badge key={g} variant="outline" className="text-[9px] px-1.5 py-0 rounded-full">{g}</Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-[10px] text-muted-foreground">
          {result.publishedYear && <span>{result.publishedYear}</span>}
          {result.userStatus && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded capitalize">
              {result.userStatus}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage(props: {
  searchParams: Promise<{
    q?: string;
    field?: string;
    sort?: string;
    lib?: string;
    cat?: string;
    ol?: string;
    from?: string;
    to?: string;
    lang?: string;
    genres?: string;
    rating?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";

  // Build filters from URL params
  const filters: Partial<SearchFilters> = {
    query,
    field: (searchParams.field as SearchFilters['field']) || 'all',
    sortBy: (searchParams.sort as SearchFilters['sortBy']) || 'relevance',
    searchLibrary: searchParams.lib !== '0',
    searchCatalogs: searchParams.cat !== '0',
    searchOpenLibrary: searchParams.ol !== '0',
    yearFrom: searchParams.from ? parseInt(searchParams.from) : undefined,
    yearTo: searchParams.to ? parseInt(searchParams.to) : undefined,
    language: searchParams.lang || undefined,
    genres: searchParams.genres ? searchParams.genres.split(',') : undefined,
    minRating: searchParams.rating ? parseFloat(searchParams.rating) : undefined,
  };

  let response = null;
  if (query.trim()) {
    response = await globalSearch(filters);
  }

  const activeFilters = [
    filters.field !== 'all' && `Field: ${filters.field}`,
    filters.sortBy !== 'relevance' && `Sort: ${filters.sortBy}`,
    !filters.searchLibrary && 'Library off',
    !filters.searchCatalogs && 'Catalogs off',
    !filters.searchOpenLibrary && 'Open Library off',
    filters.yearFrom && `From ${filters.yearFrom}`,
    filters.yearTo && `To ${filters.yearTo}`,
    filters.language && `Language: ${filters.language}`,
    filters.genres && filters.genres.length > 0 && `${filters.genres.length} genre(s)`,
    filters.minRating && `${filters.minRating}+ stars`,
  ].filter(Boolean) as string[];

  return (
    <PageShell as="main" className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Search Results"
        description={
          query
            ? `${response ? response.total : 0} result${response?.total !== 1 ? "s" : ""} for \u201C${query}\u201D`
            : "Enter a term in the search bar to find books across your library, OPDS catalogs, and Open Library."
        }
      />

      {query && response && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Library className="w-3 h-3" /> {response.sources.library}</span>
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {response.sources.catalogs}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {response.sources.openlibrary}</span>
          <span className="text-muted-foreground/40">|</span>
          <span>{response.timing}ms</span>
        </div>
      )}

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>
          {activeFilters.map((f) => (
            <Badge key={f} variant="secondary" className="text-[10px] rounded-full px-2">{f}</Badge>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            className="text-[10px] text-muted-foreground hover:text-foreground ml-1"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Results */}
      {!query ? null : response && response.results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {response.results.map((result) => (
            <SearchResultCard key={result.id} result={result} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
          <Search className="w-12 h-12 mb-4 text-muted-foreground/20" />
          <h3 className="text-lg font-medium text-foreground mb-1">No results found</h3>
          <p className="max-w-md">
            We couldn&apos;t find anything matching &ldquo;{query}&rdquo; across all sources. Try different keywords, broaden your filters, or check spelling.
          </p>
          <div className="flex gap-3 mt-6">
            <Link href="/discover" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> Discover books
            </Link>
          </div>
        </div>
      )}
    </PageShell>
  );
}
