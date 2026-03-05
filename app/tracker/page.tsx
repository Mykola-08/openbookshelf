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
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
             <BookOpen className="w-8 h-8 text-blue-600" />
             My Reading Progress
           </h1>
           <div className="text-sm text-gray-500">
              Total Tracked: {userBooks?.length || 0}
           </div>
        </div>

        {/* Kanban Board Style Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  {col.icon} {col.label}
                </h2>
                <Badge variant="secondary">{col.items.length}</Badge>
              </div>

              <div className="space-y-3 flex-1">
                {col.items.length === 0 ? (
                   <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-sm">
                      No books here.
                   </div>
                ) : (
                  col.items.map((ub: any) => {
                    const book = ub.books;
                    const primaryAuthor = book?.authors?.[0]?.name || 'Unknown Author';
                    return (
                      <Card key={ub.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0 flex h-24">
                          <div className="w-16 bg-gray-200 shrink-0">
                            {/* Note: In a real environment, replace with Cover Image */}
                          </div>
                          <div className="p-3 flex-1 flex flex-col justify-center min-w-0">
                             <Link href={`/book/${book?.id}`} className="font-medium text-sm text-gray-900 truncate hover:text-blue-600 transition-colors">
                                {book?.title || 'Unknown Title'}
                             </Link>
                             <p className="text-xs text-gray-500 truncate">{primaryAuthor}</p>
                             
                             {col.id === 'reading' && ub.reading_location && (
                                <div className="mt-2 text-[10px] uppercase font-bold text-orange-600 tracking-wider flex items-center gap-1">
                                   <Flame className="w-3 h-3" /> In Progress
                                </div>
                             )}
                          </div>
                        </CardContent>
                      </Card>
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
