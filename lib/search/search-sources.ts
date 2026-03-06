/**
 * Search Sources
 * 
 * Individual search providers that the search engine queries in parallel.
 * Each returns SearchResult[] in a normalized format.
 */

import { SearchResult, SearchFilters } from './search-engine';

// ---- Library Search (Supabase) ----

export async function searchLibrary(
  filters: SearchFilters,
  supabase: any,
  userId?: string
): Promise<SearchResult[]> {
  if (!filters.searchLibrary || !filters.query.trim()) return [];

  const q = filters.query.trim();

  // Search books by title
  const titleQuery = supabase
    .from('books')
    .select('*, authors(*), book_genres(genres(name))')
    .ilike('title', `%${q}%`)
    .limit(30);

  // Search by author name
  const authorQuery = supabase
    .from('authors')
    .select('id, name')
    .ilike('name', `%${q}%`)
    .limit(10);

  // Search by description
  const descQuery = supabase
    .from('books')
    .select('*, authors(*), book_genres(genres(name))')
    .ilike('description', `%${q}%`)
    .limit(20);

  // Search by ISBN
  const isbnQuery = supabase
    .from('books')
    .select('*, authors(*), book_genres(genres(name))')
    .or(`isbn_10.eq.${q},isbn_13.eq.${q.replace(/-/g, '')}`)
    .limit(5);

  const [titleRes, authorRes, descRes, isbnRes] = await Promise.all([
    titleQuery, authorQuery, descQuery, isbnQuery
  ]);

  const allBooks = new Map<string, any>();

  // Collect title matches
  for (const book of (titleRes.data || [])) {
    allBooks.set(book.id, book);
  }

  // Collect description matches
  for (const book of (descRes.data || [])) {
    if (!allBooks.has(book.id)) allBooks.set(book.id, book);
  }

  // Collect ISBN matches
  for (const book of (isbnRes.data || [])) {
    if (!allBooks.has(book.id)) allBooks.set(book.id, book);
  }

  // Fetch books by matching authors
  const authorIds = (authorRes.data || []).map((a: any) => a.id);
  if (authorIds.length > 0) {
    const { data: authorBooks } = await supabase
      .from('book_authors')
      .select('books(*, authors(*), book_genres(genres(name)))')
      .in('author_id', authorIds)
      .limit(30);

    for (const row of (authorBooks || [])) {
      const book = (row as any).books;
      if (book && !allBooks.has(book.id)) {
        allBooks.set(book.id, book);
      }
    }
  }

  // Get user reading data if logged in
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userBookMap = new Map<string, any>();
  if (userId) {
    const bookIds = Array.from(allBooks.keys());
    if (bookIds.length > 0) {
      const { data: userBooks } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', userId)
        .in('book_id', bookIds);
      for (const ub of (userBooks || [])) {
        userBookMap.set(ub.book_id, ub);
      }
    }
  }

  // Transform to SearchResult
  const results: SearchResult[] = [];
  for (const book of allBooks.values()) {
    const ub = userBookMap.get(book.id);
    const genres = (book.book_genres || [])
      .map((bg: any) => bg.genres?.name)
      .filter(Boolean);

    const result: SearchResult = {
      id: `lib-${book.id}`,
      title: book.title || '',
      authors: (book.authors || []).map((a: any) => a.name),
      coverUrl: book.cover_url,
      description: book.description,
      publishedYear: book.published_year,
      language: book.language,
      genres,
      isbn: book.isbn_13 || book.isbn_10,
      rating: book.avg_rating,
      ratingCount: book.rating_count,
      source: 'library',
      sourceId: book.id,
      userStatus: ub?.status,
      userRating: ub?.rating,
      userProgress: ub?.progress,
      inLibrary: !!ub,
      relevanceScore: 0,
      popularityScore: 0,
      personalScore: 0,
      finalScore: 0,
    };
    results.push(result);
  }

  return results;
}

// ---- OPDS Catalog Search ----

interface OPDSCatalog {
  id: string;
  name: string;
  searchUrl: string;  // OpenSearch template URL
  baseUrl: string;
}

const DEFAULT_OPDS_CATALOGS: OPDSCatalog[] = [
  {
    id: 'gutenberg',
    name: 'Project Gutenberg',
    searchUrl: 'https://m.gutenberg.org/ebooks/search.opds/?query={searchTerms}',
    baseUrl: 'https://m.gutenberg.org',
  },
  {
    id: 'standardebooks',
    name: 'Standard Ebooks',
    searchUrl: 'https://standardebooks.org/opds/all?query={searchTerms}',
    baseUrl: 'https://standardebooks.org',
  },
  {
    id: 'feedbooks',
    name: 'Feedbooks',
    searchUrl: 'https://catalog.feedbooks.com/search.atom?query={searchTerms}',
    baseUrl: 'https://catalog.feedbooks.com',
  },
];

async function searchSingleOPDS(catalog: OPDSCatalog, query: string): Promise<SearchResult[]> {
  try {
    const url = catalog.searchUrl.replace('{searchTerms}', encodeURIComponent(query));
    const { parseOPDS } = await import('@/lib/connectors/opds');
    const res = await fetch(url, { next: { revalidate: 300 } }); // Cache 5 min
    if (!res.ok) return [];
    const text = await res.text();
    const feed = await parseOPDS(text);

    return feed.entries.map((entry): SearchResult => {
      const imageLink = entry.links.find(l =>
        l.type?.startsWith('image/') || l.rel?.includes('image') || l.rel?.includes('thumbnail')
      );
      const categories = entry.category?.map(c => c.label || c.term).filter(Boolean) || [];
      const epubLink = entry.links.find(l => l.type === 'application/epub+zip');

      return {
        id: `opds-${catalog.id}-${entry.id}`,
        title: entry.title,
        authors: entry.authors.map(a => a.name).filter(Boolean),
        coverUrl: imageLink?.href,
        description: entry.summary || entry.content,
        genres: categories,
        formats: epubLink ? ['EPUB'] : [],
        source: 'opds',
        sourceId: entry.id,
        sourceName: catalog.name,
        catalogUrl: catalog.baseUrl,
        inLibrary: false,
        relevanceScore: 0,
        popularityScore: 0,
        personalScore: 0,
        finalScore: 0,
      };
    });
  } catch (e) {
    console.warn(`[Search] OPDS search failed for ${catalog.name}:`, e);
    return [];
  }
}

export async function searchOPDSCatalogs(
  filters: SearchFilters,
  customCatalogs?: OPDSCatalog[]
): Promise<SearchResult[]> {
  if (!filters.searchCatalogs || !filters.query.trim()) return [];

  const catalogs = [...DEFAULT_OPDS_CATALOGS, ...(customCatalogs || [])];
  const promises = catalogs.map(c => searchSingleOPDS(c, filters.query));
  const results = await Promise.allSettled(promises);

  const allResults: SearchResult[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      allResults.push(...r.value);
    }
  }
  return allResults;
}

// ---- Open Library Search ----

interface OpenLibDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
  subject?: string[];
  language?: string[];
  ratings_average?: number;
  ratings_count?: number;
  edition_count?: number;
  number_of_pages_median?: number;
}

export async function searchOpenLibrary(filters: SearchFilters): Promise<SearchResult[]> {
  if (!filters.searchOpenLibrary || !filters.query.trim()) return [];

  try {
    const params = new URLSearchParams({
      q: filters.query,
      limit: '20',
      fields: 'key,title,author_name,cover_i,first_publish_year,isbn,subject,language,ratings_average,ratings_count,edition_count',
    });

    // Add field-specific search
    if (filters.field === 'title') params.set('title', filters.query);
    if (filters.field === 'author') params.set('author', filters.query);
    if (filters.field === 'isbn') params.set('isbn', filters.query);

    // Year filter
    if (filters.yearFrom || filters.yearTo) {
      const from = filters.yearFrom || 0;
      const to = filters.yearTo || new Date().getFullYear();
      params.set('first_publish_year', `[${from} TO ${to}]`);
    }

    // Language filter
    if (filters.language) {
      params.set('language', filters.language);
    }

    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      next: { revalidate: 600 } // Cache 10 min
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.docs || []).map((doc: OpenLibDoc): SearchResult => ({
      id: `ol-${doc.key}`,
      title: doc.title,
      authors: doc.author_name || [],
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
      publishedYear: doc.first_publish_year,
      isbn: doc.isbn?.[0],
      genres: (doc.subject || []).slice(0, 5),
      language: doc.language?.[0],
      rating: doc.ratings_average,
      ratingCount: doc.ratings_count,
      source: 'openlibrary',
      sourceId: doc.key,
      sourceName: 'Open Library',
      inLibrary: false,
      relevanceScore: 0,
      popularityScore: 0,
      personalScore: 0,
      finalScore: 0,
    }));
  } catch (e) {
    console.warn('[Search] Open Library search failed:', e);
    return [];
  }
}
