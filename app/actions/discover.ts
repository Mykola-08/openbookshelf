'use server';

import { createClient } from '@/utils/supabase/server';
import { buildUserProfile, generateDiscoverFeed, FeedSection } from '@/lib/search/recommender';

export async function getDiscoverFeed(): Promise<FeedSection[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let context = null;

  if (user) {
    // Build user profile from their library
    const { data: userBooks } = await supabase
      .from('user_books')
      .select('status, rating, books(title, authors(name), book_genres(genres(name)))')
      .eq('user_id', user.id)
      .limit(200);

    if (userBooks && userBooks.length > 0) {
      const processed = userBooks.map((ub: any) => ({
        title: ub.books?.title || '',
        authors: (ub.books?.authors || []).map((a: any) => a.name),
        genres: (ub.books?.book_genres || []).map((bg: any) => bg.genres?.name).filter(Boolean),
        rating: ub.rating,
        status: ub.status,
      }));
      context = buildUserProfile(processed);
    }
  }

  return generateDiscoverFeed(context);
}
