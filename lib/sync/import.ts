// Optimized OPDS Import Logic
import { createClient } from "@/utils/supabase/server";

// Helper to normalized strings for matching
function slugify(text: string): string {
  if (!text) return '';
  return text.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function normalizeAuthor(name: string): string {
  if (!name) return '';
  if (name.includes(',')) {
    const [last, first] = name.split(',').map(s => s.trim());
    return `${first} ${last}`;
  }
  return name.trim();
}

/**
 * Imports a single book entry from an OPDS feed into the database.
 * Optimized to prevent duplication and handle relationships (Authors, Series).
 */
export async function importBookFromOPDS(entry: any, sourceId: string, userId: string) {
  const supabase = await createClient();
  const title = entry.title || "Untitled";

  console.log(`[Import] Processing: ${title} (${entry.id})`);

  // 0. Check if this item was already imported from this source for this user
  // This is the primary optimization to skip expensive processing.
  // We check 'source_items' mapping.
  const { data: existingSourceItem } = await supabase
    .from('source_items')
    .select('user_book_id')
    .eq('source_id', sourceId)
    .eq('remote_id', entry.id)
    .maybeSingle();

  if (existingSourceItem) {
      console.log(`[Import] Skipped existing: ${title}`);
      return existingSourceItem.user_book_id;
  }

  // 1. Resolve Authors
  // Collect all unique author IDs to link later
  const authorIds: string[] = [];
  const entryAuthors = Array.isArray(entry.authors) ? entry.authors : (entry.authors ? [entry.authors] : []);
  
  for (const auth of entryAuthors) {
    const name = auth?.name;
    if (!name) continue;
    
    const cleanName = normalizeAuthor(name);
    const slug = slugify(cleanName);

    // Try to find existing author
    let { data: existingAuthor } = await supabase
      .from('authors')
      .select('id')
      .or(`name.eq."${cleanName}",slug.eq."${slug}"`)
      .maybeSingle();

    if (existingAuthor) {
      authorIds.push(existingAuthor.id);
    } else {
      // Create new author if not found
      // Note: In high concurrency, this could still duplicate if not using unique constraints on db level strictly.
      // Ideally 'slug' should be unique.
      const { data: newAuthor, error } = await supabase
        .from('authors')
        .insert({ name: cleanName, slug })
        .select('id')
        .single();
      
      if (newAuthor) authorIds.push(newAuthor.id);
      else if (error) console.error(`[Import] Author creation failed for ${cleanName}`, error);
    }
  }

  // 2. Resolve Series
  // Logic: series info can be in links (rel="http://opds-spec.org/group" / "collection")
  // or implicit in titles.
  const seriesLinks = entry.links?.filter((l: any) => 
    l.rel === 'http://opds-spec.org/group' || 
    l.rel === 'collection' ||
    l.title?.toLowerCase().includes('series')
  ) || [];

  const seriesToLink: { id: string; volume?: number }[] = [];

  for (const link of seriesLinks) {
      if (!link.title) continue;
      const seriesName = link.title;
      const seriesSlug = slugify(seriesName);

      // Try to find existing series
      let { data: existingSeries } = await supabase
        .from('series')
        .select('id')
        .eq('name', seriesName)
        .maybeSingle();

      if (existingSeries) {
          seriesToLink.push({ id: existingSeries.id });
      } else {
           const { data: newSeries } = await supabase
            .from('series')
            .insert({ name: seriesName, slug: seriesSlug, source_url: link.href })
            .select('id')
            .single();
           if (newSeries) seriesToLink.push({ id: newSeries.id });
      }
  }

  // 3. Resolve/Create Canonical Book
  // Attempt to match by unique ID if available, or Title + Author heuristic
  const cleanTitle = title.trim();
  
  const bookData = {
    title: cleanTitle,
    description: entry.summary || entry.content,
    published_year: entry.updated ? new Date(entry.updated).getFullYear() : null,
    cover_url: entry.links?.find((l: any) => l.rel?.includes('image') || l.type?.startsWith('image/'))?.href,
    updated_at: new Date().toISOString()
    // We don't have a reliable ISBN in generic OPDS usually.
  };

  let bookId: string | null = null;
  
  // Try to find match by title (Simple Heuristic for now)
  // Ideally, matching logic would be more sophisticated (fuzzy match, author check)
  const { data: potentialMatches } = await supabase
    .from('books')
    .select('id, title')
    .eq('title', cleanTitle)
    .limit(5);

  if (potentialMatches && potentialMatches.length > 0) {
      // Pick the first one for now (or improve logic to check authors)
      bookId = potentialMatches[0].id;
  } else {
      // Create new book
      const { data: newBook, error } = await supabase
        .from('books')
        .insert(bookData)
        .select('id')
        .single();
      
      if (newBook) bookId = newBook.id;
      else {
          console.error("[Import] Book creation failed", error);
          return null;
      }
  }

  if (!bookId) return null;

  // 4. Link Authors & Series to Book
  // We use Promise.all to run these in parallel
  const tasks = [];

  // Link Authors
  if (authorIds.length > 0) {
     const authorLinks = authorIds.map(aid => ({ book_id: bookId!, author_id: aid }));
     // Upsert to avoid "duplicate key" errors if link exists
     tasks.push(supabase.from('book_authors').upsert(authorLinks, { onConflict: 'book_id,author_id' }));
  }

  // Link Series
  if (seriesToLink.length > 0) {
     const sLinks = seriesToLink.map(s => ({ book_id: bookId!, series_id: s.id, volume_number: s.volume }));
     tasks.push(supabase.from('book_series').upsert(sLinks, { onConflict: 'book_id,series_id' }));
  }

  await Promise.all(tasks);

  // 5. Create User Book (Library Entry)
  let userBookId: string | null = null;
  
  const { data: existingUserBook } = await supabase
    .from('user_books')
    .select('id')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle();

  if (existingUserBook) {
      userBookId = existingUserBook.id;
  } else {
      const { data: newUserBook } = await supabase
        .from('user_books')
        .insert({ 
            user_id: userId, 
            book_id: bookId, 
            status: 'toread',
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (newUserBook) userBookId = newUserBook.id;
  }

  if (!userBookId) return null;

  // 6. Link Source Item (Sync State)
  // Vital for tracking sync status
  await supabase.from('source_items').upsert({
      source_id: sourceId,
      remote_id: entry.id,
      user_book_id: userBookId,
      sync_state: 'synced',
      last_synced_data: entry,
      last_seen_at: new Date().toISOString()
  }, { onConflict: 'source_id, remote_id' });

  // 7. Store File Links (EPUB)
  const epubLink = entry.links?.find((l: any) => l.type?.includes('epub') || l.href?.endsWith('.epub') || l.rel === 'http://opds-spec.org/acquisition');
  
  if (epubLink && epubLink.href) {
    // Check duplication
    const { count } = await supabase
        .from('book_files')
        .select('*', { count: 'exact', head: true })
        .eq('book_id', bookId)
        .eq('file_url', epubLink.href);

    if (count === 0) {
        await supabase.from('book_files').insert({
            book_id: bookId,
            format: 'epub',
            file_url: epubLink.href,
            source_origin: sourceId,
            size_bytes: null // Could fetch HEAD to get size
        });
    }
  }

  return userBookId;
}
