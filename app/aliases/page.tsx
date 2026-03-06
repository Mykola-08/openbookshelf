import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { AliasReviewBoard, type AliasReviewItem } from "@/components/AliasReviewBoard";
import { MODULE_COOKIE_NAME, parseModuleState } from "@/lib/config/modules";

interface AliasRow {
  id: string;
  alias_title: string;
  status: string;
  yes_votes: number;
  no_votes: number;
  origin_source_name: string | null;
  origin_remote_id: string | null;
  canonical_book_id: string;
  books: { title?: string } | null;
}

export default async function AliasesPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const modules = parseModuleState(cookieStore.get(MODULE_COOKIE_NAME)?.value || null);
  const aliasModuleEnabled = Boolean(modules.enabled.alias_resolution);
  const reviewModuleEnabled = Boolean(modules.enabled.community_alias_review);

  if (!aliasModuleEnabled) {
    return (
      <main className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
        <div className="panel-surface p-6 space-y-3">
          <h1 className="text-2xl font-bold text-strong-ui">Alias Review</h1>
          <p className="text-sm text-muted-foreground">Alias Resolution module is disabled.</p>
          <Button asChild variant="outline">
            <Link href="/settings">Open Settings</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!reviewModuleEnabled) {
    return (
      <main className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
        <div className="panel-surface p-6 space-y-3">
          <h1 className="text-2xl font-bold text-strong-ui">Alias Review</h1>
          <p className="text-sm text-muted-foreground">
            Community Alias Review module is disabled. Alias search still works for approved aliases.
          </p>
        </div>
      </main>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
        <div className="panel-surface p-6 space-y-3">
          <h1 className="text-2xl font-bold text-strong-ui">Alias Review</h1>
          <p className="text-sm text-muted-foreground">You must be logged in to view aliases for your library.</p>
        </div>
      </main>
    );
  }

  // Get only the user's books 
  const { data: userBooksData } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("user_id", user.id);

  const userBookIds = userBooksData ? userBooksData.map((ub: { book_id: string }) => ub.book_id) : [];

  let typedRows: AliasRow[] = [];
  
  if (userBookIds.length > 0) {
    const aliasRows = await supabase
        .from("book_aliases")
        .select("id, alias_title, status, yes_votes, no_votes, origin_source_name, origin_remote_id, canonical_book_id, books(title)")
        .in("canonical_book_id", userBookIds)
        .order("created_at", { ascending: false })
        .limit(100);
        
    typedRows = (aliasRows.data || []) as AliasRow[];
  }

  const items: AliasReviewItem[] = typedRows
    .filter((row) => row.status === "pending" || row.status === "approved" || row.status === "rejected")
    .map((row) => ({
      id: row.id,
      aliasTitle: row.alias_title,
      canonicalBookId: row.canonical_book_id,
      canonicalBookTitle: row.books?.title || "Unknown Book",
      status: row.status || "pending",
      yesVotes: Number(row.yes_votes || 0),
      noVotes: Number(row.no_votes || 0),
      originSourceName: row.origin_source_name || null,
      originRemoteId: row.origin_remote_id || null,
    }));

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 min-h-screen">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Library Aliases</h1>
        <p className="text-sm text-muted-foreground">
          Vote whether alternate titles map to the same book in your library. Approved aliases become searchable.
        </p>
      </section>
      
      {items.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-xl bg-card">
           <h3 className="text-lg font-medium text-foreground">No aliases found</h3>
           <p className="text-sm text-muted-foreground mt-2">There are currently no alternate title mappings to review for books in your library.</p>
        </div>
      ) : (
        <AliasReviewBoard items={items} />
      )}
    </main>
  );
}
