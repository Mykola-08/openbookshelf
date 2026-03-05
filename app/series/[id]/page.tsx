import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";
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
          status, progress
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

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      {/* Header Banner */}
      <div className="bg-white border-b border-gray-200 py-8 px-4 md:px-8">
         <div className="max-w-5xl mx-auto">
             <Button variant="ghost" asChild className="pl-0 gap-2 text-gray-500 hover:text-gray-900 mb-4 -ml-2">
                <Link href="/series">
                  <ArrowLeft className="w-4 h-4" />
                  All Series
                </Link>
             </Button>
             <div className="flex items-center gap-3">
               <Layers className="w-8 h-8 text-purple-600" />
               <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{series.name}</h1>
             </div>
             {series.description && (
                 <p className="text-gray-600 mt-4 max-w-2xl leading-relaxed">{series.description}</p>
             )}
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {books.map((b: any) => (
               <Link href={`/book/${b.id}`} key={b.id} className="group h-full">
                  <div className="flex bg-white rounded-lg border border-gray-200 p-4 gap-4 hover:shadow-md transition-all h-full">
                    {/* Cover Image */}
                    <div className="relative w-20 h-28 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                      {b.cover_url ? (
                        <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <BookOpen className="w-6 h-6 opacity-30" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col pt-1">
                      {b.volume_number && (
                        <div className="text-xs font-semibold text-purple-600 mb-1 uppercase tracking-wider">
                          Book {b.volume_number}
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2" title={b.title}>
                        {b.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                         {b.authors.join(', ') || 'Unknown Author'}
                      </p>
                      
                      <div className="mt-auto pt-4 flex items-center gap-2">
                         {b.userBook?.status === 'reading' ? (
                           <div className="flex-1 flex items-center gap-2">
                             <Progress value={b.userBook.progress > 0 ? b.userBook.progress : 5} className="h-1.5 flex-1 bg-blue-100" />
                             <span className="text-[10px] text-gray-400">{b.userBook.progress}%</span>
                           </div>
                         ) : b.userBook?.status ? (
                           <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal capitalize bg-gray-100 text-gray-600">
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
