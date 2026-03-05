import { createClient } from "@/utils/supabase/server";
import { BookOpen, CheckCircle2, Bookmark, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function TrackerPage() {
  const supabase = await createClient();

  // Get user_books with relations to generate the dashboard
  const { data: userBooks } = await supabase
    .from('user_books')
    .select('*, books(*, authors(*))');

  const reading = userBooks?.filter((ub: any) => ub.reading_state === 'reading') || [];
  const planToRead = userBooks?.filter((ub: any) => ub.reading_state === 'plan_to_read') || [];
  const finished = userBooks?.filter((ub: any) => ub.reading_state === 'finished') || [];
  const dropped = userBooks?.filter((ub: any) => ub.reading_state === 'dropped') || [];

  const columns = [
    { id: 'reading', label: 'Currently Reading', icon: <Flame className="w-4 h-4 text-orange-500" />, items: reading },
    { id: 'plan', label: 'Plan to Read', icon: <Bookmark className="w-4 h-4 text-blue-500" />, items: planToRead },
    { id: 'finished', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, items: finished },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <div className="flex items-end justify-between border-b pb-6">
           <div className="space-y-1">
             <h1 className="text-3xl font-semibold tracking-tight">
               Reading Progress
             </h1>
             <p className="text-muted-foreground text-sm">
               Track and organize what you are reading
             </p>
           </div>
           <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 py-1.5 px-3 rounded-full">
              <BookOpen className="w-4 h-4" />
              <span>{userBooks?.length || 0} Total</span>
           </div>
        </div>

        {/* Kanban Board Style Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-foreground flex items-center gap-2">
                  {col.icon} {col.label}
                </h2>
                <Badge variant="secondary" className="rounded-full px-2">{col.items.length}</Badge>
              </div>

              <div className="space-y-3 flex-1">
                {col.items.length === 0 ? (
                   <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-dashed text-muted-foreground text-sm">
                      <Bookmark className="w-6 h-6 mb-2 opacity-20" />
                      No books here
                   </div>
                ) : (
                  col.items.map((ub: any) => {
                    const book = ub.books;
                    const primaryAuthor = book?.authors?.[0]?.name || 'Unknown Author';
                    return (
                      <Link key={ub.id} href={`/book/${book?.id}`} className="group block">
                        <div className="relative overflow-hidden rounded-xl border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-sm">
                          <div className="flex gap-4">
                            <div className="h-20 w-14 overflow-hidden rounded-md bg-muted shrink-0 shadow-sm">
                              {book?.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-muted flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                               <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                  {book?.title || 'Unknown Title'}
                               </h3>
                               <p className="text-sm text-muted-foreground truncate mt-0.5">{primaryAuthor}</p>
                               
                               {col.id === 'reading' && ub.reading_location && (
                                  <div className="mt-2 text-[10px] uppercase font-bold text-orange-500 tracking-wider flex items-center gap-1.5 opacity-80">
                                     <Flame className="w-3 h-3" /> In Progress
                                  </div>
                               )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
