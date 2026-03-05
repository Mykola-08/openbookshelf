import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function AuthorsPage() {
  const supabase = await createClient();

  // Fetch authors and their book count
  const { data: authors, error } = await supabase
    .from('authors')
    .select(`
      id,
      name,
      slug,
      photo_url,
      book_authors (count)
    `)
    .order('name', { ascending: true });

  if (error || !authors) {
    return <div className="p-8">Found no authors or an error occurred.</div>;
  }

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 min-h-screen bg-gray-50">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Authors</h1>
        <p className="text-gray-500 text-sm mt-1">Browse your library by author.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {authors.map((author: any) => (
          <Link href={`/authors/${author.slug || author.id}`} key={author.id}>
             <Card className="hover:shadow-md transition-all h-full group">
               <CardHeader className="flex flex-row items-center gap-4 pb-2">
                 <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 group-hover:border-blue-200 transition-colors">
                   {author.photo_url ? (
                      <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
                   ) : (
                      <User className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                   )}
                 </div>
                 <div>
                   <CardTitle className="text-base group-hover:text-blue-600 transition-colors">{author.name}</CardTitle>
                 </div>
               </CardHeader>
               <CardContent>
                 <p className="text-xs text-gray-500">
                   {author.book_authors[0]?.count || 0} books
                 </p>
               </CardContent>
             </Card>
          </Link>
        ))}
        {authors.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No authors found. Import some books to see them here!
          </div>
        )}
      </div>
    </main>
  );
}
