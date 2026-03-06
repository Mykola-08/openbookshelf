'use server';

import { createClient } from '@/utils/supabase/server';
import {
  SearchFilters,
  SearchResponse,
  DEFAULT_FILTERS,
  computeRelevanceScore,
  computePopularityScore,
  computePersonalScore,
  computeFinalScore,
  rankResults,
  deduplicateResults,
} from '@/lib/search/search-engine';
import { searchLibrary, searchOPDSCatalogs, searchOpenLibrary } from '@/lib/search/search-sources';

export async function globalSearch(
  partialFilters: Partial<SearchFilters>
): Promise<SearchResponse> {
  const start = performance.now();
  const filters: SearchFilters = { ...DEFAULT_FILTERS, ...partialFilters };

  if (!filters.query.trim()) {
    return {
      results: [],
      total: 0,
      page: 1,
      pageSize: filters.pageSize,
      sources: { library: 0, catalogs: 0, openlibrary: 0 },
      query: '',
      timing: 0,
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's genre/author profile for personalization
  let userGenres: string[] = [];
  let userAuthors: string[] = [];

  if (user) {
    const { data: userBooks } = await supabase
      .from('user_books')
      .select('books(authors(name), book_genres(genres(name)))')
      .eq('user_id', user.id)
      .limit(100);

    if (userBooks) {
      const genreSet = new Set<string>();
      const authorSet = new Set<string>();
      for (const ub of userBooks) {
        const book = (ub as any).books;
        if (book?.authors) {
          for (const a of book.authors) {
            if (a.name) authorSet.add(a.name);
          }
        }
        if (book?.book_genres) {
          for (const bg of book.book_genres) {
            if (bg.genres?.name) genreSet.add(bg.genres.name);
          }
        }
      }
      userGenres = Array.from(genreSet);
      userAuthors = Array.from(authorSet);
    }
  }

  // Run all search sources in parallel
  const [libraryResults, catalogResults, openLibResults] = await Promise.all([
    searchLibrary(filters, supabase, user?.id),
    searchOPDSCatalogs(filters),
    searchOpenLibrary(filters),
  ]);

  // Mark library books in external results
  const libraryTitles = new Set(libraryResults.map(r => r.title.toLowerCase()));
  const libraryIsbns = new Set(libraryResults.filter(r => r.isbn).map(r => r.isbn!.replace(/-/g, '')));

  const markInLibrary = (results: typeof libraryResults) => {
    for (const r of results) {
      if (libraryTitles.has(r.title.toLowerCase())) r.inLibrary = true;
      if (r.isbn && libraryIsbns.has(r.isbn.replace(/-/g, ''))) r.inLibrary = true;
    }
    return results;
  };

  markInLibrary(catalogResults);
  markInLibrary(openLibResults);

  // Score all results
  const allResults = [...libraryResults, ...catalogResults, ...openLibResults];

  for (const r of allResults) {
    r.relevanceScore = computeRelevanceScore(filters.query, r, filters.field);
    r.popularityScore = computePopularityScore(r);
    r.personalScore = computePersonalScore(r, userGenres, userAuthors);
    r.finalScore = computeFinalScore(r.relevanceScore, r.popularityScore, r.personalScore);

    // Library results get a slight boost
    if (r.source === 'library') {
      r.finalScore += 0.1;
    }
  }

  // Deduplicate and rank
  let results = deduplicateResults(allResults);

  // Apply post-filters
  if (filters.yearFrom) {
    results = results.filter(r => !r.publishedYear || r.publishedYear >= filters.yearFrom!);
  }
  if (filters.yearTo) {
    results = results.filter(r => !r.publishedYear || r.publishedYear <= filters.yearTo!);
  }
  if (filters.genres && filters.genres.length > 0) {
    results = results.filter(r => {
      if (!r.genres || r.genres.length === 0) return true; // Don't exclude unknowns
      return r.genres.some(g => filters.genres!.some(fg => g.toLowerCase().includes(fg.toLowerCase())));
    });
  }
  if (filters.minRating) {
    results = results.filter(r => !r.rating || r.rating >= filters.minRating!);
  }
  if (filters.language) {
    results = results.filter(r => !r.language || r.language.toLowerCase().includes(filters.language!.toLowerCase()));
  }

  // Rank
  results = rankResults(results, filters.sortBy);

  // Paginate
  const total = results.length;
  const pageStart = (filters.page - 1) * filters.pageSize;
  const paged = results.slice(pageStart, pageStart + filters.pageSize);

  const timing = Math.round(performance.now() - start);

  return {
    results: paged,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    sources: {
      library: libraryResults.length,
      catalogs: catalogResults.length,
      openlibrary: openLibResults.length,
    },
    query: filters.query,
    timing,
  };
}
