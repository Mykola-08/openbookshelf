import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Check, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MODULE_COOKIE_NAME, parseModuleState } from "@/lib/config/modules";
import { GenerateDescriptionButton, GenerateChapterSummaryButton } from "@/components/AIGenerateButtons";

type SearchParamValue = string | string[] | undefined;

const getSingleParam = (value: SearchParamValue): string => {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
};

const normalizeStatus = (status: string | null | undefined): "toread" | "reading" | "finished" | "abandoned" => {
  if (!status) return "toread";
  if (status === "plan_to_read") return "toread";
  if (status === "dropped") return "abandoned";
  if (status === "toread" || status === "reading" || status === "finished" || status === "abandoned") {
    return status;
  }
  return "toread";
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
  const bookSummaryEnabled = Boolean(moduleState.enabled.book_summary);
  const chapterSummaryEnabled = Boolean(moduleState.enabled.chapter_summary);
  const aliasResolutionEnabled = Boolean(moduleState.enabled.alias_resolution);
  const aiGenerationEnabled = Boolean(moduleState.enabled.ai_generation);

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
    status: normalizeStatus(userBookRaw.status || userBookRaw.reading_state),
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

        <div className="flex flex-col md:flex-row gap-8 items-start">
           {/* Cover Column */}
           <div className="w-full md:w-1/3 max-w-[300px] shrink-0">
             <div className="aspect-[2/3] panel-surface rounded-lg shadow-md overflow-hidden relative">
               {book.cover_url ? (
                 <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-[var(--surface)] text-muted-ui">
                   <BookOpen className="w-16 h-16" />
                 </div>
               )}
             </div>

             <div className="mt-6 flex flex-col gap-3">
                {file ? (
                  <Button className="w-full" size="lg" asChild>
                    <Link href={`/read/${book.id}`}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      {userBook?.reading_location ? "Continue Reading" : userBook?.progress > 0 ? `Continue Reading (${userBook.progress}%)` : 'Start Reading'}
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled variant="secondary">
                    No File Available
                  </Button>
                )}
                
                {userBook && (
                  <div className="w-full mt-2">
                     <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-ui">Status</span>
                        <span className="font-medium capitalize text-strong-ui">{userBook.status}</span>
                     </div>
                     {userBook.status === "reading" && userBook.progress !== null && userBook.progress !== undefined && (
                       <div className="flex justify-between text-sm">
                         <span className="text-muted-ui">Progress</span>
                         <span className="font-medium text-strong-ui">{userBook.progress}%</span>
                       </div>
                     )}
                  </div>
                )}
             </div>
           </div>

           {/* Details Column */}
           <div className="flex-1 w-full">
              {seriesInfo && (
                <Link href={`/series/${seriesInfo.series.slug || seriesInfo.series.id}`} className="text-[var(--brand)] font-medium text-sm hover:underline mb-2 block">
                  {seriesInfo.series.name} {seriesInfo.volume_number ? `#${seriesInfo.volume_number}` : ''}
                </Link>
              )}
              
              <h1 className="text-4xl font-bold text-strong-ui tracking-tight leading-tight mb-2">
                {book.title}
              </h1>
              
              <div className="text-xl text-muted-ui mb-6 flex flex-wrap items-center gap-2">
                {authors.map((author, i) => (
                  <span key={author.id}>
                    <Link href={`/authors/${author.slug || author.id}`} className="hover:text-[var(--brand)] hover:underline transition-colors">
                      {author.name}
                    </Link>
                    {i < authors.length - 1 && ", "}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                 {book.published_year && (
                   <div className="flex items-center gap-1.5 text-sm text-muted-ui panel-surface px-3 py-1.5 rounded-full">
                     <Calendar className="w-4 h-4" />
                     {book.published_year}
                   </div>
                 )}
                 {file && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-ui panel-surface px-3 py-1.5 rounded-full font-mono uppercase">
                      <Check className="w-4 h-4 text-[var(--brand)]" />
                      {file.format}
                    </div>
                 )}
              </div>

              <div className="space-y-6">
                 <div>
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="font-semibold text-strong-ui text-lg">Description</h3>
                     {!book.description && aiGenerationEnabled && <GenerateDescriptionButton bookId={book.id} />}
                   </div>
                   <div 
                     className="text-muted-ui leading-relaxed max-w-none prose prose-sm"
                     dangerouslySetInnerHTML={{ __html: book.description || '<p className="text-muted-ui italic">No description available.</p>' }}
                   />
                 </div>

                 {bookSummaryEnabled && (
                   <Card className="panel-surface">
                     <CardContent className="p-5 space-y-2">
                       <h3 className="font-semibold text-strong-ui text-lg">Book Summary</h3>
                       <p className="text-sm text-muted-ui leading-relaxed">{generatedSummary}</p>
                     </CardContent>
                   </Card>
                 )}

                 {aliasResolutionEnabled && (
                   <Card className="panel-surface">
                     <CardContent className="p-5 space-y-3">
                       <h3 className="font-semibold text-strong-ui text-lg">Aliases</h3>
                       {aliases.length === 0 ? (
                         <p className="text-sm text-muted-ui">
                           No aliases recorded yet. Imports with alternate titles will appear here.
                         </p>
                       ) : (
                         <div className="space-y-2">
                           {aliases.map((alias) => (
                             <div key={alias.id} className="panel-surface px-3 py-2 rounded-md">
                               <div className="flex items-center justify-between gap-3">
                                 <div>
                                   <p className="font-medium text-sm text-strong-ui">{alias.alias_title}</p>
                                   <p className="text-xs text-muted-ui">
                                     Source: {alias.origin_source_name || "unknown"} | Votes {alias.yes_votes}/{alias.no_votes}
                                   </p>
                                 </div>
                                 <div className="text-xs text-muted-ui capitalize">
                                   {alias.status}
                                   {alias.is_default ? " • default" : ""}
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 )}

                 <Card className="panel-surface">
                   <CardContent className="p-5">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                       <h3 className="font-semibold text-strong-ui text-lg flex items-center gap-2">
                         <ListOrdered className="w-5 h-5 text-muted-ui" />
                         Chapters
                       </h3>
                       <div className="flex items-center gap-2">
                         <Button size="sm" variant={chapterOrder === "newest" ? "default" : "outline"} asChild>
                           <Link href={`/book/${id}`}>Newest first</Link>
                         </Button>
                         <Button size="sm" variant={chapterOrder === "oldest" ? "default" : "outline"} asChild>
                           <Link href={`/book/${id}?order=oldest`}>Oldest first</Link>
                         </Button>
                       </div>
                     </div>

                     {chapters.length === 0 ? (
                       <div className="text-sm text-muted-ui panel-surface border-dashed rounded-md p-4">
                         No chapter index is available yet for this book.
                       </div>
                     ) : (
                       <div className="space-y-2">
                         {chapters.map((chapter) => (
                           <div key={chapter.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md panel-surface px-3 py-2">
                             <div className="min-w-0">
                               <div className="font-medium text-sm text-strong-ui truncate">
                                 {chapter.chapter_number ? `Chapter ${chapter.chapter_number}: ` : ""}
                                 {chapter.title || "Untitled Chapter"}
                               </div>
                               <div className="text-xs text-muted-ui mt-0.5 flex items-center gap-3">
                                 {chapter.published_at ? (
                                   <span>{new Date(chapter.published_at).toLocaleDateString()}</span>
                                 ) : null}
                                 {chapter.word_count ? (
                                   <span>{chapter.word_count.toLocaleString()} words</span>
                                 ) : null}
                               </div>
                               {chapterSummaryEnabled && (
                                 <div className="mt-2 mb-1">
                                   <p className="text-sm text-muted-foreground">
                                     {chapter.summary || "No summary available for this chapter."}
                                   </p>
                                   {!chapter.summary && aiGenerationEnabled && (
                                     <GenerateChapterSummaryButton 
                                       bookId={book.id} 
                                       chapterId={chapter.id} 
                                       chapterTitle={chapter.title || "Chapter " + (chapter.chapter_number || "")} 
                                     />
                                   )}
                                 </div>
                               )}
                             </div>
                             {chapter.chapter_url ? (
                               <Button size="sm" variant="outline" asChild className="mt-2 sm:mt-0">
                                 <Link href={chapter.chapter_url}>Open</Link>
                               </Button>
                             ) : null}
                           </div>
                         ))}
                       </div>
                     )}
                   </CardContent>
                 </Card>
              </div>
           </div>
        </div>
        
      </div>
    </div>
  );
}
