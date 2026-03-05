import { createClient } from "@/utils/supabase/server";
import BookCard from "@/components/BookCard";
import { Search } from "lucide-react";
import React from 'react';

export const dynamic = "force-dynamic";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || "";
  const supabase = await createClient();

  let books: any[] = [];
  
  if (query.trim()) {
    const { data } = await supabase
      .from("books")
      .select("*, authors(*)")
      .ilike("title", `%${query}%`)
      .limit(50);
      
    books = data || [];
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
        {query ? (
          <p className="text-muted-foreground">Showing results for "{query}"</p>
        ) : (
          <p className="text-muted-foreground">Enter a term to search</p>
        )}
      </div>

      {!query ? null : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {books.map(book => (
            <BookCard 
              key={book.id} 
              book={{
                ...book,
                authors: book.authors?.map((a: any) => a.name)
              }} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
          <Search className="w-12 h-12 mb-4 text-muted/30" />
          <h3 className="text-lg font-medium text-foreground mb-1">No results found</h3>
          <p className="max-w-md">We couldn't find any books matching your search. Try different keywords or check spelling.</p>
        </div>
      )}
    </main>
  );
}
