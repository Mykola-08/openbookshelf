/**
 * Smart Search Engine
 * 
 * Multi-source search that spans:
 * - User's local Supabase library (books, authors, series)
 * - OPDS catalogs (Gutenberg, Standard Ebooks, Feedbooks, custom)
 * - Open Library public API
 * 
 * Features:
 * - Fuzzy matching with Levenshtein tolerance
 * - Popularity-weighted ranking
 * - Field-specific search (title, author, description, ISBN, genre)
 * - Personalization based on user reading history
 */

export interface SearchFilters {
  query: string;
  // Scopes
  searchLibrary: boolean;
  searchCatalogs: boolean;
  searchOpenLibrary: boolean;
  // Field filters
  field: 'all' | 'title' | 'author' | 'description' | 'isbn' | 'genre';
  // Constraints
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  genres?: string[];
  formats?: string[];
  minRating?: number;
  // Sorting
  sortBy: 'relevance' | 'popularity' | 'year_desc' | 'year_asc' | 'rating' | 'title_asc';
  // Pagination
  page: number;
  pageSize: number;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  description?: string;
  publishedYear?: number;
  language?: string;
  genres?: string[];
  formats?: string[];
  isbn?: string;
  rating?: number;
  ratingCount?: number;
  // Source info
  source: 'library' | 'opds' | 'openlibrary';
  sourceId?: string;
  sourceName?: string;
  catalogUrl?: string;
  // For library items
  userStatus?: string;
  userRating?: number;
  userProgress?: number;
  // Ranking
  relevanceScore: number;
  popularityScore: number;
  personalScore: number;
  finalScore: number;
  inLibrary: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  sources: {
    library: number;
    catalogs: number;
    openlibrary: number;
  };
  query: string;
  timing: number;
}

export const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  searchLibrary: true,
  searchCatalogs: true,
  searchOpenLibrary: true,
  field: 'all',
  sortBy: 'relevance',
  page: 1,
  pageSize: 40,
};

// --- Scoring helpers ---

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase().trim();

  if (!q || !t) return 0;

  // Exact match
  if (t === q) return 1.0;

  // Starts with
  if (t.startsWith(q)) return 0.95;

  // Contains exact
  if (t.includes(q)) return 0.85;

  // Word-level match
  const queryWords = q.split(/\s+/);
  const textWords = t.split(/\s+/);
  let wordMatches = 0;
  for (const qw of queryWords) {
    if (textWords.some(tw => tw.includes(qw) || qw.includes(tw))) {
      wordMatches++;
    }
  }
  const wordScore = queryWords.length > 0 ? (wordMatches / queryWords.length) * 0.75 : 0;

  // Levenshtein for short queries
  if (q.length <= 20) {
    const dist = levenshtein(q, t.substring(0, Math.min(t.length, q.length + 5)));
    const levScore = Math.max(0, 1 - dist / Math.max(q.length, 1)) * 0.6;
    return Math.max(wordScore, levScore);
  }

  return wordScore;
}

export function computeRelevanceScore(query: string, result: Partial<SearchResult>, field: SearchFilters['field']): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  let titleScore = 0;
  let authorScore = 0;
  let descScore = 0;
  let isbnScore = 0;
  let genreScore = 0;

  if (field === 'all' || field === 'title') {
    titleScore = fuzzyScore(q, result.title || '') * 1.0;
  }
  if (field === 'all' || field === 'author') {
    const authorText = (result.authors || []).join(' ');
    authorScore = fuzzyScore(q, authorText) * 0.9;
  }
  if (field === 'all' || field === 'description') {
    descScore = fuzzyScore(q, result.description || '') * 0.5;
  }
  if (field === 'all' || field === 'isbn') {
    if (result.isbn && result.isbn.includes(q.replace(/-/g, ''))) {
      isbnScore = 1.0;
    }
  }
  if (field === 'all' || field === 'genre') {
    const genreText = (result.genres || []).join(' ');
    genreScore = fuzzyScore(q, genreText) * 0.7;
  }

  return Math.max(titleScore, authorScore, descScore, isbnScore, genreScore);
}

export function computePopularityScore(result: Partial<SearchResult>): number {
  const ratingWeight = (result.rating || 0) / 5;
  const ratingCountWeight = Math.min((result.ratingCount || 0) / 1000, 1);
  return ratingWeight * 0.6 + ratingCountWeight * 0.4;
}

export function computePersonalScore(
  result: Partial<SearchResult>,
  userGenres: string[],
  userAuthors: string[],
): number {
  let score = 0;

  // Boost if user reads this author
  const authorMatch = (result.authors || []).some(a =>
    userAuthors.some(ua => ua.toLowerCase() === a.toLowerCase())
  );
  if (authorMatch) score += 0.4;

  // Boost if genre overlaps with user's genres
  const genreOverlap = (result.genres || []).filter(g =>
    userGenres.some(ug => ug.toLowerCase() === g.toLowerCase())
  ).length;
  if (genreOverlap > 0) score += Math.min(genreOverlap * 0.15, 0.45);

  // Boost if already in library (for discovery, slight deprioritization)
  if (result.inLibrary) score += 0.15;

  return Math.min(score, 1);
}

export function computeFinalScore(
  relevance: number,
  popularity: number,
  personal: number,
): number {
  // Weighted: relevance 50%, popularity 25%, personal 25%
  return relevance * 0.50 + popularity * 0.25 + personal * 0.25;
}

export function rankResults(results: SearchResult[], sortBy: SearchFilters['sortBy']): SearchResult[] {
  const sorted = [...results];
  
  switch (sortBy) {
    case 'relevance':
      sorted.sort((a, b) => b.finalScore - a.finalScore);
      break;
    case 'popularity':
      sorted.sort((a, b) => b.popularityScore - a.popularityScore || b.finalScore - a.finalScore);
      break;
    case 'year_desc':
      sorted.sort((a, b) => (b.publishedYear || 0) - (a.publishedYear || 0));
      break;
    case 'year_asc':
      sorted.sort((a, b) => (a.publishedYear || 9999) - (b.publishedYear || 9999));
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'title_asc':
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    default:
      sorted.sort((a, b) => b.finalScore - a.finalScore);
  }

  return sorted;
}

export function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();

  for (const r of results) {
    // Dedupe by ISBN first, then title+author
    const isbnKey = r.isbn ? `isbn:${r.isbn.replace(/-/g, '')}` : null;
    const titleKey = `title:${(r.title || '').toLowerCase().trim()}|${(r.authors || []).map(a => a.toLowerCase()).sort().join(',')}`;

    const key = isbnKey || titleKey;
    const existing = seen.get(key);

    if (!existing || r.finalScore > existing.finalScore) {
      // Keep higher scored version, but mark inLibrary if any version is
      if (existing?.inLibrary) r.inLibrary = true;
      if (existing?.source === 'library') {
        r.userStatus = existing.userStatus;
        r.userRating = existing.userRating;
        r.userProgress = existing.userProgress;
      }
      seen.set(key, r);
    } else if (r.source === 'library') {
      existing.inLibrary = true;
      existing.userStatus = r.userStatus;
      existing.userRating = r.userRating;
      existing.userProgress = r.userProgress;
    }
  }

  return Array.from(seen.values());
}
