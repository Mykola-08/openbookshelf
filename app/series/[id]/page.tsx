import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, Star, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default async function SeriesDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: series } = await supabase
    .from('series')
    .select('*')
    .or(`id.eq.${id},slug.eq."${id}"`)
    .single();

  if (!series) {
    notFound();
  }

  // Get books in this series, ordered by volume
  const { data: bookLinks } = await supabase
    .from('book_series')
    .select(`
      volume_number,
      books (
        id, title, cover_url, published_year,
        book_authors (
          authors (id, name)
        ),
        user_books (
          status, progress, rating
        )
      )
    `)
    .eq('series_id', series.id)
    .order('volume_number', { ascending: true, nullsFirst: false });

  const books = bookLinks?.map((bl: any) => ({
    ...bl.books,
    volume_number: bl.volume_number,
    userBook: bl.books?.user_books?.[0],
    authors: bl.books?.book_authors?.map((a:any) => a.authors?.name).filter(Boolean) || []
  })) || [];

  // Compute richer stats
  const totalBooks = books.length;
  const finishedBooks = books.filter((b: any) => b.userBook?.status === 'finished').length;
  const readingBooks = books.filter((b: any) => b.userBook?.status === 'reading').length;
  const ratedBooks = books.filter((b: any) => b.userBook?.status && b.userBook?.rating > 0);
  const avgRating = ratedBooks.length > 0
    ? (ratedBooks.reduce((sum: number, b: any) => sum + (b.userBook?.rating || 0), 0) / ratedBooks.length).toFixed(1)
    : null;
  const completionPct = totalBooks > 0 ? Math.round((finishedBooks / totalBooks) * 100) : 0;

  return (
    <main className="min-h-screen bg-background pb-12">
      {/* Header Banner */}
      <div className="bg-card border-b border-border py-8 px-4 md:px-8">
         <div className="max-w-5xl mx-auto">
             <Button variant="ghost" asChild className="pl-0 gap-2 text-muted-foreground hover:text-foreground mb-4 -ml-2">
                <Link href="/series">
                  <ArrowLeft className="w-4 h-4" />
                  All Series
                </Link>
             </Button>
             <div className="flex items-center gap-3">
               <Layers className="w-8 h-8 text-primary" />
               <h1 className="text-2xl font-semibold text-foreground tracking-tight">{series.name}</h1>
             </div>
             {series.description && (
                 <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">{series.description}</p>
             )}
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
         {/* Stats Cards */}
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
           <div className="bg-card rounded-xl border p-4 text-center">
             <BookOpen className="w-5 h-5 text-primary mx-auto mb-1.5" />
             <p className="text-2xl font-bold text-foreground">{totalBooks}</p>
             <p className="text-xs text-muted-foreground">Total Books</p>
           </div>
           <div className="bg-card rounded-xl border p-4 text-center">
             <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1.5" />
             <p className="text-2xl font-bold text-foreground">{finishedBooks}</p>
             <p className="text-xs text-muted-foreground">Completed</p>
           </div>
           <div className="bg-card rounded-xl border p-4 text-center">
             <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1.5" />
             <p className="text-2xl font-bold text-foreground">{readingBooks}</p>
             <p className="text-xs text-muted-foreground">In Progress</p>
           </div>
           <div className="bg-card rounded-xl border p-4 text-center">
             <Star className="w-5 h-5 text-primary mx-auto mb-1.5" />
             <p className="text-2xl font-bold text-foreground">{avgRating ?? '—'}</p>
             <p className="text-xs text-muted-foreground">Avg Rating</p>
           </div>
         </div>

         {/* Completion progress */}
         {totalBooks > 0 && (
           <div className="mb-8 bg-card rounded-xl border p-4">
             <div className="flex items-center justify-between mb-2">
               <span className="text-sm font-medium text-foreground">Series Completion</span>
               <span className="text-sm text-muted-foreground">{completionPct}%</span>
             </div>
             <Progress value={completionPct} className="h-2" />
             <p className="text-xs text-muted-foreground mt-1.5">{finishedBooks} of {totalBooks} books finished</p>
           </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.map((b: any) => (
               <Link href={`/book/${b.id}`} key={b.id} className="group h-full">
                  <div className="flex bg-card rounded-lg border border-border p-4 gap-4 hover:shadow-md transition-all h-full">
                    {/* Cover Image */}
                    <div className="relative w-20 h-28 bg-muted rounded overflow-hidden flex-shrink-0 border border-border">
                      {b.cover_url ? (
                        <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <BookOpen className="w-6 h-6 opacity-30" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col pt-1">
                      {b.volume_number && (
                        <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                          Book {b.volume_number}
                        </div>
                      )}
                      <h3 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2" title={b.title}>
                        {b.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                         {b.authors.join(', ') || 'Unknown Author'}
                      </p>
                      
                      <div className="mt-auto pt-4 flex items-center gap-2">
                         {b.userBook?.status === 'reading' ? (
                           <div className="flex-1 flex items-center gap-2">
                             <Progress value={b.userBook.progress > 0 ? b.userBook.progress : 5} className="h-1.5 flex-1" />
                             <span className="text-[10px] text-muted-foreground">{b.userBook.progress}%</span>
                           </div>
                         ) : b.userBook?.status ? (
                           <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal capitalize">
                             {b.userBook.status}
                           </Badge>
                         ) : null}
                      </div>
                    </div>
                  </div>
               </Link>
            ))}
         </div>
      </div>
    </main>
  );
}
