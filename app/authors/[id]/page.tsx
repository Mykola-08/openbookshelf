import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, BookOpen, Star, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default async function AuthorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: author } = await supabase
    .from('authors')
    .select('*')
    .or(`id.eq.${id},slug.eq."${id}"`)
    .single();

  if (!author) {
    notFound();
  }

  // Get books by this author
  const { data: bookLinks } = await supabase
    .from('book_authors')
    .select(`
      books (
        id, title, cover_url, published_year,
        book_authors (
          authors (id, name)
        ),
        user_books (
          status, progress
        )
      )
    `)
    .eq('author_id', author.id);

  const books = bookLinks?.map((bl: any) => ({
    ...bl.books,
    userBook: bl.books?.user_books?.[0]
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
      <div className="bg-card border-b border-border py-12 px-4 md:px-8">
         <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
           <div className="w-32 h-32 bg-muted rounded-full border-4 border-background shadow-lg overflow-hidden flex items-center justify-center shrink-0">
               {author.photo_url ? (
                  <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
               ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
               )}
           </div>
           <div className="flex-1 mt-2">
              <Button variant="ghost" asChild className="pl-0 gap-2 text-muted-foreground hover:text-foreground mb-2 -ml-2 -mt-4">
                <Link href="/authors">
                  <ArrowLeft className="w-4 h-4" />
                  All Authors
                </Link>
              </Button>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">{author.name}</h1>
              {author.bio && (
                 <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">{author.bio}</p>
              )}
           </div>
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
               <span className="text-sm font-medium text-foreground">Reading Completion</span>
               <span className="text-sm text-muted-foreground">{completionPct}%</span>
             </div>
             <Progress value={completionPct} className="h-2" />
             <p className="text-xs text-muted-foreground mt-1.5">{finishedBooks} of {totalBooks} books finished</p>
           </div>
         )}

         <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
            Books by {author.name} ({books.length})
         </h2>

         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((b: any) => (
               <Link href={`/book/${b.id}`} key={b.id} className="group flex flex-col h-full">
                  <div className="relative aspect-[2/3] bg-muted rounded-lg shadow-sm border border-border overflow-hidden mb-3 group-hover:shadow-md transition-all">
                    {b.cover_url ? (
                      <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground">
                        <BookOpen className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {b.title}
                    </h3>
                    {b.published_year && (
                      <p className="text-xs text-muted-foreground mb-2">{b.published_year}</p>
                    )}
                    
                    <div className="mt-auto pt-2 flex items-center gap-2">
                       {b.userBook?.status === 'reading' ? (
                         <div className="w-full">
                           <Progress value={b.userBook.progress > 0 ? b.userBook.progress : 5} className="h-1.5 w-full" />
                           <span className="text-[10px] text-muted-foreground mt-1 block">{b.userBook.progress}% completed</span>
                         </div>
                       ) : b.userBook?.status ? (
                         <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal capitalize">
                           {b.userBook.status}
                         </Badge>
                       ) : null}
                    </div>
                  </div>
               </Link>
            ))}
         </div>
      </div>
    </main>
  );
}
