import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { BookOpen } from "lucide-react";
import { TrackerBoard } from "@/components/TrackerBoard";
import { ReadingInsights } from "@/components/ReadingInsights";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import { USER_SETTINGS_COOKIE_NAME, parseUserSettings } from "@/lib/config/user-settings";

export const dynamic = 'force-dynamic';

export default async function TrackerPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const userSettings = parseUserSettings(cookieStore.get(USER_SETTINGS_COOKIE_NAME)?.value ? decodeURIComponent(cookieStore.get(USER_SETTINGS_COOKIE_NAME)!.value) : null);
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase.from('user_books').select('*, books(*, authors(*))');
  if (user) {
    query = query.eq('user_id', user.id);
  }
  const { data: userBooks } = await query;

  const trackerBooks = (userBooks || []).map((ub: any) => ({
    id: ub.id,
    bookId: ub.books?.id || ub.book_id,
    title: ub.books?.title || 'Unknown Title',
    author: ub.books?.authors?.[0]?.name || 'Unknown Author',
    coverUrl: ub.books?.cover_url,
    progress: ub.progress || 0,
    status: ub.status || 'toread',
  }));

  const insightBooks = (userBooks || []).map((ub: any) => ({
    id: ub.id,
    status: ub.status || 'toread',
    progress: ub.progress || 0,
    started_at: ub.started_at,
    finished_at: ub.finished_at,
    created_at: ub.created_at,
    books: {
      title: ub.books?.title,
      authors: ub.books?.authors,
    },
  }));

  return (
    <PageShell className="space-y-8">

        <PageHeader
          title="Reading Progress"
          description="Drag books between columns to update status."
          actions={
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 border border-border/30 py-1 px-2.5 rounded-lg">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{userBooks?.length || 0} books</span>
            </div>
          }
        />

        {userSettings.enableReadingInsights && <ReadingInsights books={insightBooks} />}

        <TrackerBoard initialBooks={trackerBooks} />
    </PageShell>
  );
}
