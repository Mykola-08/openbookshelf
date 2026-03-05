import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, BookOpen } from "lucide-react";
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

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      {/* Header Banner */}
      <div className="bg-white border-b border-gray-200 py-12 px-4 md:px-8">
         <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
           <div className="w-32 h-32 bg-gray-100 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center shrink-0">
               {author.photo_url ? (
                  <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
               ) : (
                  <User className="w-12 h-12 text-gray-300" />
               )}
           </div>
           <div className="flex-1 mt-2">
              <Button variant="ghost" asChild className="pl-0 gap-2 text-gray-500 hover:text-gray-900 mb-2 -ml-2 -mt-4">
                <Link href="/authors">
                  <ArrowLeft className="w-4 h-4" />
                  All Authors
                </Link>
              </Button>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{author.name}</h1>
              {author.bio && (
                 <p className="text-gray-600 mt-4 max-w-2xl leading-relaxed">{author.bio}</p>
              )}
           </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
         <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-400" />
            Books by {author.name} ({books.length})
         </h2>

         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((b: any) => (
               <Link href={`/book/${b.id}`} key={b.id} className="group flex flex-col h-full">
                  <div className="relative aspect-[2/3] bg-gray-100 rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-3 group-hover:shadow-md transition-all">
                    {b.cover_url ? (
                      <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                        <BookOpen className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm leading-tight text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                      {b.title}
                    </h3>
                    {b.published_year && (
                      <p className="text-xs text-gray-500 mb-2">{b.published_year}</p>
                    )}
                    
                    <div className="mt-auto pt-2 flex items-center gap-2">
                       {b.userBook?.status === 'reading' ? (
                         <div className="w-full">
                           <Progress value={b.userBook.progress > 0 ? b.userBook.progress : 5} className="h-1.5 w-full bg-blue-100" />
                           <span className="text-[10px] text-gray-400 mt-1 block">{b.userBook.progress}% completed</span>
                         </div>
                       ) : b.userBook?.status ? (
                         <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal capitalize bg-gray-100 text-gray-600">
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
