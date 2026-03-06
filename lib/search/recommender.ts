/**
 * Book Recommendation Engine
 * 
 * Generates personalized book recommendations based on:
 * - User's reading history (genres, authors, ratings)
 * - Trending/popular books globally
 * - Similar books to recently read ones
 * - Books from preferred OPDS catalogs
 * 
 * Strategies:
 * 1. Genre affinity — weight genres by read/rated frequency
 * 2. Author similarity — recommend more by favorite authors  
 * 3. Collaborative signal — use Open Library trending data
 * 4. Diversity injection — mix in undiscovered genres
 */

export interface RecommendationContext {
  userGenres: Record<string, number>;      // genre -> count
  userAuthors: Record<string, number>;     // author -> count
  userRatedBooks: { title: string; rating: number; genres: string[]; authors: string[] }[];
  recentlyRead: string[];                  // book titles
  libraryBookIds: Set<string>;             // ISBNs or titles in library
}

export interface RecommendedBook {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  description?: string;
  publishedYear?: number;
  genres?: string[];
  rating?: number;
  ratingCount?: number;
  source: 'openlibrary' | 'opds' | 'curated';
  sourceId?: string;
  reason: string;           // "Because you read X" / "Popular in Y"
  reasonType: 'genre' | 'author' | 'trending' | 'similar' | 'diverse';
  score: number;
  isbn?: string;
}

export interface FeedSection {
  id: string;
  title: string;
  subtitle?: string;
  type: 'horizontal' | 'grid' | 'featured';
  books: RecommendedBook[];
}

// --- Build user profile from library data ---

export function buildUserProfile(
  userBooks: Array<{
    title: string;
    authors: string[];
    genres: string[];
    rating?: number;
    status: string;
  }>
): RecommendationContext {
  const userGenres: Record<string, number> = {};
  const userAuthors: Record<string, number> = {};
  const userRatedBooks: RecommendationContext['userRatedBooks'] = [];
  const recentlyRead: string[] = [];
  const libraryBookIds = new Set<string>();

  for (const book of userBooks) {
    libraryBookIds.add(book.title.toLowerCase());

    // Count genres
    for (const g of book.genres) {
      userGenres[g] = (userGenres[g] || 0) + 1;
    }

    // Count authors
    for (const a of book.authors) {
      userAuthors[a] = (userAuthors[a] || 0) + 1;
    }

    if (book.rating && book.rating >= 4) {
      userRatedBooks.push({
        title: book.title,
        rating: book.rating,
        genres: book.genres,
        authors: book.authors,
      });
    }

    if (book.status === 'reading' || book.status === 'finished') {
      recentlyRead.push(book.title);
    }
  }

  return { userGenres, userAuthors, userRatedBooks, recentlyRead, libraryBookIds };
}

// --- Fetch trending books from Open Library ---

export async function fetchTrendingBooks(limit: number = 20): Promise<RecommendedBook[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/trending/daily.json?limit=${limit}`,
      { next: { revalidate: 3600 } } // Cache 1 hour
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.works || []).map((work: any): RecommendedBook => ({
      id: `trending-${work.key}`,
      title: work.title,
      authors: work.author_name || [],
      coverUrl: work.cover_i ? `https://covers.openlibrary.org/b/id/${work.cover_i}-M.jpg` : undefined,
      publishedYear: work.first_publish_year,
      genres: (work.subject || []).slice(0, 4),
      rating: work.ratings_average,
      ratingCount: work.ratings_count,
      source: 'openlibrary',
      sourceId: work.key,
      reason: 'Trending today',
      reasonType: 'trending',
      score: 0.5 + (work.ratings_average || 0) / 10,
    }));
  } catch {
    return [];
  }
}

// --- Fetch by subject from Open Library ---

async function fetchBySubject(subject: string, limit: number = 12): Promise<RecommendedBook[]> {
  try {
    const encoded = encodeURIComponent(subject.toLowerCase().replace(/\s+/g, '_'));
    const res = await fetch(
      `https://openlibrary.org/subjects/${encoded}.json?limit=${limit}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    
    return (data.works || []).map((work: any): RecommendedBook => ({
      id: `subj-${subject}-${work.key}`,
      title: work.title,
      authors: (work.authors || []).map((a: any) => a.name),
      coverUrl: work.cover_id ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg` : undefined,
      publishedYear: work.first_publish_year,
      genres: [subject],
      source: 'openlibrary',
      sourceId: work.key,
      reason: `Popular in ${subject}`,
      reasonType: 'genre',
      score: 0,
    }));
  } catch {
    return [];
  }
}

// --- Fetch by author from Open Library ---

async function fetchByAuthor(authorName: string, limit: number = 8): Promise<RecommendedBook[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&sort=rating&limit=${limit}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.docs || []).map((doc: any): RecommendedBook => ({
      id: `author-${doc.key}`,
      title: doc.title,
      authors: doc.author_name || [authorName],
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
      publishedYear: doc.first_publish_year,
      genres: (doc.subject || []).slice(0, 4),
      rating: doc.ratings_average,
      ratingCount: doc.ratings_count,
      source: 'openlibrary',
      sourceId: doc.key,
      reason: `More by ${authorName}`,
      reasonType: 'author',
      score: 0,
    }));
  } catch {
    return [];
  }
}

// --- Generate feed sections ---

export async function generateDiscoverFeed(
  context: RecommendationContext | null
): Promise<FeedSection[]> {
  const sections: FeedSection[] = [];

  // 1. Trending — always show
  const trending = await fetchTrendingBooks(15);
  if (trending.length > 0) {
    sections.push({
      id: 'trending',
      title: 'Trending Now',
      subtitle: 'What people are reading today',
      type: 'horizontal',
      books: filterOutLibrary(trending, context?.libraryBookIds),
    });
  }

  if (context) {
    // 2. Based on top genres
    const topGenres = Object.entries(context.userGenres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    for (const genre of topGenres) {
      const genreBooks = await fetchBySubject(genre, 12);
      const filtered = filterOutLibrary(genreBooks, context.libraryBookIds);
      if (filtered.length >= 3) {
        sections.push({
          id: `genre-${genre}`,
          title: `Because you like ${genre}`,
          subtitle: `Popular ${genre.toLowerCase()} books`,
          type: 'horizontal',
          books: filtered.map(b => ({ ...b, reason: `Popular in ${genre}`, reasonType: 'genre' as const })),
        });
      }
    }

    // 3. Based on top authors
    const topAuthors = Object.entries(context.userAuthors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([a]) => a);

    for (const author of topAuthors) {
      const authorBooks = await fetchByAuthor(author, 10);
      const filtered = filterOutLibrary(authorBooks, context.libraryBookIds);
      if (filtered.length >= 2) {
        sections.push({
          id: `author-${author}`,
          title: `More by ${author}`,
          subtitle: `Explore other works`,
          type: 'horizontal',
          books: filtered,
        });
      }
    }

    // 4. Diversity injection — pick a genre user hasn't explored
    const allCommonGenres = ['Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'History', 'Philosophy', 'Biography', 'Psychology', 'Science', 'Poetry', 'Horror', 'Thriller'];
    const unexplored = allCommonGenres.filter(g => !context.userGenres[g]);
    if (unexplored.length > 0) {
      const pick = unexplored[Math.floor(Math.random() * unexplored.length)];
      const diverseBooks = await fetchBySubject(pick, 10);
      const filtered = filterOutLibrary(diverseBooks, context.libraryBookIds);
      if (filtered.length >= 3) {
        sections.push({
          id: `discover-${pick}`,
          title: `Discover ${pick}`,
          subtitle: 'Something different for you',
          type: 'horizontal',
          books: filtered.map(b => ({ ...b, reason: `Try something new`, reasonType: 'diverse' as const })),
        });
      }
    }
  } else {
    // No user context — show curated popular genres
    const defaultGenres = ['Science Fiction', 'Fantasy', 'Mystery', 'History'];
    for (const genre of defaultGenres) {
      const books = await fetchBySubject(genre, 10);
      if (books.length >= 3) {
        sections.push({
          id: `popular-${genre}`,
          title: `Popular in ${genre}`,
          type: 'horizontal',
          books,
        });
      }
    }
  }

  return sections;
}

function filterOutLibrary(books: RecommendedBook[], libraryIds?: Set<string>): RecommendedBook[] {
  if (!libraryIds || libraryIds.size === 0) return books;
  return books.filter(b => !libraryIds.has(b.title.toLowerCase()));
}
