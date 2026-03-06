import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Check, ListOrdered, Globe, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MODULE_COOKIE_NAME, parseModuleState } from "@/lib/config/modules";
import { USER_SETTINGS_COOKIE_NAME, parseUserSettings } from "@/lib/config/user-settings";
import { GenerateDescriptionButton, GenerateChapterSummaryButton } from "@/components/AIGenerateButtons";
import { CommunityBookSection } from "@/components/CommunityBookSection";
import { QuickActionsBar } from "@/components/QuickActionsBar";
import { EditableMetadataPanel } from "@/components/EditableMetadataPanel";
import { DeleteBookDialog } from "@/components/DeleteBookDialog";
import { BookHealthPanel } from "@/components/BookHealthPanel";
import { CopyButton } from "@/components/CopyButton";
import { ReadingTimeline } from "@/components/ReadingTimeline";

type SearchParamValue = string | string[] | undefined;

const getSingleParam = (value: SearchParamValue): string => {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
};

const normalizeStatus = (status: string | null | undefined): "toread" | "reading" | "finished" | "abandoned" => {
  if (!status) return "toread";
  // Transition map for legacy string constants
  const map: Record<string, "toread" | "reading" | "finished" | "abandoned"> = {
    plan_to_read: "toread",
    dropped: "abandoned",
    toread: "toread",
    reading: "reading",
    finished: "finished",
    abandoned: "abandoned"
  };
  return map[status] || "toread";
};

interface AuthorSummary {
  id: string;
  name: string;
  slug?: string | null;
}

interface ChapterSummary {
  id: string;
  title?: string | null;
  chapter_number?: number | null;
  word_count?: number | null;
  published_at?: string | null;
  chapter_url?: string | null;
  summary?: string | null;
}

interface BookAliasRow {
  id: string;
  alias_title: string;
  status: string;
  is_default: boolean;
  yes_votes: number;
  no_votes: number;
  origin_source_name?: string | null;
}

const summarizePlainText = (input: string, sentences = 3): string => {
  const plain = input
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return "No summary available.";

  const parts = plain.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length === 0) return plain;
  return parts.slice(0, sentences).join(" ");
};

export default async function BookDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, SearchParamValue>>;
}) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const chapterOrder = getSingleParam(resolvedSearchParams.order) === "oldest" ? "oldest" : "newest";
  const moduleState = parseModuleState(cookieStore.get(MODULE_COOKIE_NAME)?.value || null);
  const userSettings = parseUserSettings(cookieStore.get(USER_SETTINGS_COOKIE_NAME)?.value ? decodeURIComponent(cookieStore.get(USER_SETTINGS_COOKIE_NAME)!.value) : null);
  const bookSummaryEnabled = Boolean(moduleState.enabled.book_summary) && userSettings.enableBookSummary;
  const chapterSummaryEnabled = Boolean(moduleState.enabled.chapter_summary);
  const aliasResolutionEnabled = Boolean(moduleState.enabled.alias_resolution) && userSettings.enableAliases;
  const aiGenerationEnabled = Boolean(moduleState.enabled.ai_generation);
  const chaptersEnabled = userSettings.enableChapters;
  const bookHealthEnabled = userSettings.enableBookHealth;
  const readingTimelineEnabled = userSettings.enableReadingTimeline;
  const sourceProvenanceEnabled = userSettings.enableSourceProvenance;
  const copyButtonsEnabled = userSettings.enableCopyButtons;
  const quickActionsEnabled = userSettings.enableQuickActions;

  // Fetch book with relationships
  const { data: book } = await supabase
    .from('books')
    .select(`
      *,
      book_authors (
        authors (id, name, slug)
      ),
      book_series (
        volume_number,
        series (id, name, slug)
      ),
      user_books (*),
      book_files (
        id,
        format,
        file_url
      )
    `)
    .eq('id', id)
    .single();

  if (!book) {
    notFound();
  }

  const authors: AuthorSummary[] = book.book_authors
    ?.map((ba: { authors?: AuthorSummary | null }) => ba.authors)
    .filter(Boolean) || [];
  const seriesInfo = book.book_series?.[0]; // assuming single series for now
  const userBookRaw = book.user_books?.[0];
  const userBook = userBookRaw ? {
    ...userBookRaw,
    status: normalizeStatus(userBookRaw.status),
  } : null;
  const file = book.book_files?.[0];

  // Chapter index is optional for now. If the table is not present, keep page functional.
  const chapterResult = await supabase
    .from("book_chapters")
    .select("id, title, chapter_number, word_count, published_at, chapter_url, summary")
    .eq("book_id", id)
    .order("chapter_number", { ascending: chapterOrder === "oldest" });
  const chapters: ChapterSummary[] = chapterResult.error ? [] : (chapterResult.data as ChapterSummary[] || []);

  const aliasesResult = await supabase
    .from("book_aliases")
    .select("id, alias_title, status, is_default, yes_votes, no_votes, origin_source_name")
    .eq("canonical_book_id", id)
    .order("is_default", { ascending: false })
    .order("yes_votes", { ascending: false });
  const aliases: BookAliasRow[] = aliasesResult.error ? [] : ((aliasesResult.data || []) as BookAliasRow[]);

  // Source provenance — which external source(s) this book came from
  interface SourceProvenance {
    sourceName: string;
    sourceType: string;
    remoteId: string;
    syncState: string;
    lastSeenAt: string | null;
    firstSeenAt: string | null;
  }
  let sourceProvenance: SourceProvenance[] = [];
  if (userBook) {
    const { data: sourceItemsRaw } = await supabase
      .from("source_items")
      .select("remote_id, sync_state, first_seen_at, last_seen_at, source_id")
      .eq("user_book_id", userBook.id);
    if (sourceItemsRaw && sourceItemsRaw.length > 0) {
      const sourceIds = [...new Set(sourceItemsRaw.map((si: any) => si.source_id))];
      const { data: sourcesRaw } = await supabase
        .from("user_sources")
        .select("id, name, type")
        .in("id", sourceIds);
      const sourceMap = Object.fromEntries((sourcesRaw || []).map((s: any) => [s.id, s]));
      sourceProvenance = sourceItemsRaw.map((si: any) => ({
        sourceName: sourceMap[si.source_id]?.name || 'Unknown',
        sourceType: sourceMap[si.source_id]?.type || 'unknown',
        remoteId: si.remote_id,
        syncState: si.sync_state || 'pending',
        lastSeenAt: si.last_seen_at,
        firstSeenAt: si.first_seen_at,
      }));
    }
  }

  const generatedSummary = summarizePlainText(book.description || "", 3);

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8">
        
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0 gap-2 text-muted-ui hover:text-strong-ui">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-start">
           {/* Cover Column */}
           <div className="w-full md:w-1/3 max-w-[280px] shrink-0 mx-auto md:mx-0">
             <div className="aspect-[2/3] bg-muted rounded-xl shadow-lg border border-border/50 overflow-hidden relative">
               {book.cover_url ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-card text-muted-foreground">
                   <BookOpen className="w-12 h-12 mb-2 opacity-20" />
                 </div>
               )}
             </div>

             <div className="mt-6 flex flex-col gap-3">
                {file ? (
                  <Button className="w-full rounded-full" size="lg" asChild>
                    <Link href={`/read/${book.id}`}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      {userBook?.reading_location ? "Continue Reading" : userBook?.progress > 0 ? `Continue Reading (${userBook.progress}%)` : 'Start Reading'}
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full rounded-full" size="lg" disabled variant="secondary">
                    No File Available
                  </Button>
                )}
                
                {userBook && (
                  <div className="w-full mt-4 bg-muted/30 p-4 rounded-xl border">
                     <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize text-foreground">{userBook.status}</span>
                     </div>
                     {userBook.status === "reading" && userBook.progress !== null && userBook.progress !== undefined && (
                       <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Progress</span>
                         <span className="font-medium text-foreground">{userBook.progress}%</span>
                       </div>
                     )}
                  </div>
                )}
             </div>
           </div>

           {/* Details Column */}
           <div className="flex-1 w-full mt-4 md:mt-0">
              {seriesInfo && (
                <Link href={`/series/${seriesInfo.series.slug || seriesInfo.series.id}`} className="text-primary font-medium text-sm hover:underline mb-2 block">
                  {seriesInfo.series.name} {seriesInfo.volume_number ? `#${seriesInfo.volume_number}` : ''}
                </Link>
              )}
              
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight leading-tight mb-3">
                {book.title}
              </h1>
              
              <div className="text-lg md:text-xl text-muted-foreground mb-6 flex flex-wrap items-center gap-2">
                {authors.map((author, i) => (
                  <span key={author.id}>
                    <Link href={`/authors/${author.slug || author.id}`} className="hover:text-primary hover:underline transition-colors">
                      {author.name}
                    </Link>
                    {i < authors.length - 1 && ", "}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                 {book.published_year && (
                   <div className="flex items-center gap-1.5 text-sm text-foreground bg-secondary px-3 py-1 rounded-full">
                     <Calendar className="w-4 h-4 text-muted-foreground" />
                     {book.published_year}
                   </div>
                 )}
                 {file && (
                    <div className="flex items-center gap-1.5 text-sm text-foreground bg-secondary px-3 py-1 rounded-full font-mono uppercase">
                      <Check className="w-4 h-4 text-primary" />
                      {file.format}
                    </div>
                 )}
              </div>

              {/* Edit & Delete Actions */}
              <div className="flex items-center gap-2 mb-4">
                <EditableMetadataPanel
                  bookId={book.id}
                  userBookId={userBook?.id}
                  initialData={{
                    title: book.title,
                    description: book.description,
                    publishedYear: book.published_year,
                    isbn13: book.isbn13,
                    coverUrl: book.cover_url,
                    authors: authors.map((a: AuthorSummary) => a.name),
                    status: userBook?.status || 'toread',
                    rating: userBook?.rating ?? null,
                    notes: userBook?.notes ?? null,
                    progress: userBook?.progress ?? null,
                  }}
                />
                <DeleteBookDialog
                  bookId={book.id}
                  userBookId={userBook?.id}
                  bookTitle={book.title}
                />
              </div>

              {/* Copy affordances */}
              {copyButtonsEnabled && (
                <div className="flex items-center gap-4 mb-8 text-xs">
                  <CopyButton value={book.id} label="Copy ID" />
                  {book.isbn13 && <CopyButton value={book.isbn13} label={`ISBN ${book.isbn13}`} />}
                  <CopyButton value={`/book/${book.id}`} label="Copy link" />
                </div>
              )}

              <div className="space-y-8">
                 <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                   <div className="flex items-center justify-between mb-4 not-prose border-b pb-2">
                     <h3 className="font-medium text-foreground text-lg">Description</h3>
                     {!book.description && aiGenerationEnabled && <GenerateDescriptionButton bookId={book.id} />}
                   </div>
                   <div 
                     dangerouslySetInnerHTML={{ __html: book.description || '<p className="italic opacity-70">No description available.</p>' }}
                   />
                 </div>

                 {bookSummaryEnabled && (
                   <Card className="bg-muted/20 border-none shadow-none">
                     <CardContent className="p-6">
                       <h3 className="font-medium text-foreground text-lg mb-3">Book Summary</h3>
                       <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{generatedSummary}</p>
                     </CardContent>
                   </Card>
                 )}

                 {aliasResolutionEnabled && (
                   <Card className="bg-muted/20 border-none shadow-none">
                     <CardContent className="p-6 space-y-4">
                       <h3 className="font-medium text-foreground text-lg border-b pb-2">Aliases</h3>
                       {aliases.length === 0 ? (
                         <p className="text-sm text-muted-foreground italic">
                           No aliases recorded yet. Imports with alternate titles will appear here.
                         </p>
                       ) : (
                         <div className="space-y-3">
                           {aliases.map((alias) => (
                             <div key={alias.id} className="bg-background border px-4 py-3 rounded-xl transition-colors hover:bg-muted/50">
                               <div className="flex items-center justify-between gap-4">
                                 <div className="min-w-0 flex-1">
                                   <p className="font-medium text-sm text-foreground truncate">{alias.alias_title}</p>
                                   <div className="flex items-center gap-3 mt-1">
                                     <p className="text-xs text-muted-foreground truncate">
                                       Source: {alias.origin_source_name || "unknown"}
                                     </p>
                                     <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        <span className="text-primary font-medium">↑{alias.yes_votes}</span>
                                        <span>•</span>
                                        <span className="text-destructive font-medium">↓{alias.no_votes}</span>
                                     </div>
                                   </div>
                                 </div>
                                 <div className="text-xs font-medium text-muted-foreground capitalize flex flex-col items-end gap-1">
                                   <span className="bg-secondary px-2 py-0.5 rounded-full">{alias.status}</span>
                                   {alias.is_default && <span className="text-primary text-[10px] uppercase tracking-wider">Default</span>}
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 )}

                 {chaptersEnabled && (
                 <Card className="bg-muted/20 border-none shadow-none">
                   <CardContent className="p-6">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b pb-4">
                       <h3 className="font-medium text-foreground text-lg flex items-center gap-2">
                         <ListOrdered className="w-5 h-5 text-muted-foreground" />
                         Chapters
                       </h3>
                       <div className="flex items-center bg-background border p-1 rounded-lg">
                         <Button size="sm" variant={chapterOrder === "newest" ? "default" : "ghost"} asChild className="rounded-md">
                           <Link href={`/book/${id}`}>Newest</Link>
                         </Button>
                         <Button size="sm" variant={chapterOrder === "oldest" ? "default" : "ghost"} asChild className="rounded-md">
                           <Link href={`/book/${id}?order=oldest`}>Oldest</Link>
                         </Button>
                       </div>
                     </div>

                     {chapters.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-10 bg-background border border-dashed border-border/50 rounded-xl">
                          <ListOrdered className="w-8 h-8 text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No chapters available</p>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         {/* Chapter progress summary */}
                         {userBook && chapters.length > 0 && (() => {
                           const totalChapters = chapters.length;
                           const isFinished = userBook.status === 'finished';
                           const isReading = userBook.status === 'reading';
                           const progress = userBook.progress ?? 0;
                           const estimatedRead = isFinished ? totalChapters : isReading ? Math.floor((progress / 100) * totalChapters) : 0;
                           if (estimatedRead === 0 && !isFinished) return null;
                           return (
                             <div className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 mb-1">
                               <span className="text-sm font-medium text-foreground">
                                 {isFinished ? 'All chapters completed' : `~${estimatedRead} of ${totalChapters} chapters read`}
                               </span>
                               <div className="flex items-center gap-1.5">
                                 {Array.from({ length: Math.min(totalChapters, 20) }).map((_, i) => {
                                   const chapterIdx = Math.floor((i / Math.min(totalChapters, 20)) * totalChapters);
                                   const isRead = chapterIdx < estimatedRead;
                                   return (
                                     <div
                                       key={i}
                                       className={`w-2 h-2 rounded-full transition-colors ${isRead ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                                     />
                                   );
                                 })}
                               </div>
                             </div>
                           );
                         })()}
                         {chapters.map((chapter, idx) => {
                           const totalChapters = chapters.length;
                           const isFinished = userBook?.status === 'finished';
                           const isReading = userBook?.status === 'reading';
                           const progress = userBook?.progress ?? 0;
                           const estimatedRead = isFinished ? totalChapters : isReading ? Math.floor((progress / 100) * totalChapters) : 0;
                           const chapterRead = idx < estimatedRead;
                           return (
                           <div key={chapter.id} className={`border bg-background rounded-xl p-4 transition-colors hover:border-primary/30 shadow-sm ${chapterRead ? 'border-l-4 border-l-primary/60' : ''}`}>
                             <div className="flex items-start justify-between gap-4">
                               <div className="flex items-start gap-3 min-w-0">
                                 {/* Progress marker */}
                                 <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${chapterRead ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                   {chapterRead ? <Check className="w-3 h-3" /> : <span className="text-[10px] font-medium text-muted-foreground">{chapter.chapter_number || idx + 1}</span>}
                                 </div>
                                 <div className="min-w-0">
                                 <h4 className={`font-medium tracking-tight line-clamp-1 ${chapterRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {chapter.title || `Chapter ${chapter.chapter_number}`}
                                 </h4>
                                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                    {chapter.chapter_number && <span>Ch. {chapter.chapter_number}</span>}
                                    {chapter.word_count && <span>{chapter.word_count.toLocaleString()} words</span>}
                                    {chapter.published_at && <span>{new Date(chapter.published_at).toLocaleDateString()}</span>}
                                 </div>
                                 
                                 {chapterSummaryEnabled && (
                                   <div className="mt-3">
                                     {chapter.summary ? (
                                        <div className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/40">
                                          {chapter.summary}
                                        </div>
                                     ) : (
                                       aiGenerationEnabled && (
                                         <GenerateChapterSummaryButton 
                                           bookId={book.id} 
                                           chapterId={chapter.id} 
                                           chapterTitle={chapter.title || "Chapter " + (chapter.chapter_number || "")} 
                                         />
                                       )
                                     )}
                                   </div>
                                 )}
                                 </div>
                               </div>
                               
                               {chapter.chapter_url && (
                                 <Button size="sm" variant="ghost" asChild className="shrink-0 text-primary hover:text-primary hover:bg-primary/10 mt-1">
                                   <Link href={chapter.chapter_url} target="_blank">Open</Link>
                                 </Button>
                               )}
                             </div>
                           </div>
                           );
                         })}
                       </div>
                     )}
                   </CardContent>
                 </Card>
                 )}

                 {userBook && readingTimelineEnabled && (
                   <ReadingTimeline
                     status={userBook.status}
                     progress={userBook.progress}
                     rating={userBook.rating}
                     startedAt={userBook.started_at}
                     finishedAt={userBook.finished_at}
                     createdAt={userBook.created_at}
                   />
                 )}

                 {/* Source Provenance */}
                 {sourceProvenanceEnabled && sourceProvenance.length > 0 && (
                   <Card className="bg-muted/20 border-none shadow-none">
                     <CardContent className="p-6">
                       <h3 className="font-medium text-foreground text-lg mb-4 flex items-center gap-2">
                         <Globe className="w-5 h-5 text-muted-foreground" />
                         Source Provenance
                       </h3>
                       <div className="space-y-3">
                         {sourceProvenance.map((sp, i) => (
                           <div key={i} className="flex items-center justify-between gap-4 bg-background border rounded-xl p-4">
                             <div className="min-w-0">
                               <p className="font-medium text-sm text-foreground">{sp.sourceName}</p>
                               <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                 <span className="capitalize">{sp.sourceType.replace('_', ' ')}</span>
                                 <span className="font-mono truncate max-w-[200px]">{sp.remoteId}</span>
                               </div>
                             </div>
                             <div className="flex flex-col items-end gap-1 shrink-0">
                               <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                 sp.syncState === 'synced' ? 'bg-primary/20 text-primary' :
                                 sp.syncState === 'conflict' ? 'bg-secondary text-secondary-foreground border border-border' :
                                 'bg-muted text-muted-foreground'
                               }`}>
                                 <RefreshCw className="w-3 h-3 inline mr-1" />
                                 {sp.syncState}
                               </span>
                               {sp.lastSeenAt && (
                                 <span className="text-[10px] text-muted-foreground">
                                   Last seen {new Date(sp.lastSeenAt).toLocaleDateString()}
                                 </span>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {bookHealthEnabled && (
                   <BookHealthPanel
                     hasCover={!!book.cover_url}
                     hasDescription={!!book.description}
                     hasGenres={false}
                     hasISBN={!!book.isbn13}
                     aliasCount={aliases.length}
                   />
                 )}
              </div>
           </div>
        </div>
        
      </div>
    </div>
  );
}
