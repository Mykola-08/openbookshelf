import os

fpath = r'app/book/[id]/page.tsx'

content = """'use client';

import { useAppStore } from "@/lib/store";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, Check, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateDescriptionButton, GenerateChapterSummaryButton } from "@/components/AIGenerateButtons";

const summarizePlainText = (input: string, sentences = 3): string => {
  const plain = input
    .replace(/<[^>]+>/g, " ")
    .replace(/\\s+/g, " ")
    .trim();

  if (!plain) return "No summary available.";

  const parts = plain.split(/(?<=[.!?])\\s+/).filter(Boolean);
  if (parts.length === 0) return plain;
  return parts.slice(0, sentences).join(" ");
};

export default function BookDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { books, updateBook, deleteBook } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const book = books.find(b => b.id === id);

  if (!book) {
    return (
      <div className="min-h-screen pb-12 flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl font-bold">Book not found</h2>
        <Button onClick={() => router.push('/')}>Go back home</Button>
      </div>
    );
  }

  // Generate fake data for the rest since we removed supabase
  const authors = book.authors.map((a, i) => ({ id: String(i), name: a }));
  const file = null; 
  const chapters: any[] = [];
  const aliases: any[] = [];
  const generatedSummary = "A mock book summary here.";

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-8">

        <div className="mb-6 flex justify-between">
          <Button variant="ghost" asChild className="pl-0 gap-2 text-muted-ui hover:text-strong-ui">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => {
            deleteBook(book.id);
            router.push('/');
          }}>
            Delete Book
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-start">
           <div className="w-full md:w-1/3 max-w-[280px] shrink-0 mx-auto md:mx-0">
             <div className="aspect-[2/3] bg-muted rounded-xl shadow-lg border border-border/50 overflow-hidden relative">
               {book.coverUrl ? (
                 <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-card text-muted-foreground">
                   <BookOpen className="w-12 h-12 mb-2 opacity-20" />
                 </div>
               )}
             </div>

             <div className="mt-6 flex flex-col gap-3">
                <Button className="w-full rounded-full" size="lg" asChild>
                  <Link href={`/read/${book.id}`}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    {book.progress && book.progress > 0 ? `Continue Reading (${book.progress}%)` : 'Start Reading'}
                  </Link>
                </Button>

                <div className="w-full mt-4 bg-muted/30 p-4 rounded-xl border">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-muted-foreground">Status</span>
                    <select
                      value={book.status}
                      onChange={(e) => updateBook(book.id, { status: e.target.value as any })}
                      className="bg-transparent font-medium capitalize text-foreground border-none outline-none cursor-pointer"
                    >
                      <option value="unread">Unread</option>
                      <option value="reading">Reading</option>
                      <option value="finished">Finished</option>
                      <option value="abandoned">Abandoned</option>
                    </select>
                  </div>
                  {book.status === "reading" && (
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-muted-foreground">Progress</span>
                       <input 
                         type="number" 
                         min="0" max="100"
                         className="w-16 bg-transparent text-right font-medium text-foreground border-b border-border/50 focus:border-primary outline-none"
                         value={book.progress || 0}
                         onChange={(e) => updateBook(book.id, { progress: Number(e.target.value) })}
                       />
                     </div>
                  )}
                  {book.status === "finished" && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Rating</span>
                      <select
                        value={book.rating || 0}
                        onChange={(e) => updateBook(book.id, { rating: Number(e.target.value) })}
                        className="bg-transparent font-medium capitalize text-foreground border-none outline-none cursor-pointer"
                      >
                        <option value={0}>0 Stars</option>
                        <option value={1}>1 Star</option>
                        <option value={2}>2 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={5}>5 Stars</option>
                      </select>
                    </div>
                  )}
                </div>
             </div>
           </div>

           <div className="flex-1 w-full mt-4 md:mt-0">
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight leading-tight mb-3">
                {book.title}
              </h1>

              <div className="text-lg md:text-xl text-muted-foreground mb-6 flex flex-wrap items-center gap-2">
                {authors.map((author, i) => (
                  <span key={author.id}>
                    <span className="hover:text-primary transition-colors">
                      {author.name}
                    </span>
                    {i < authors.length - 1 && ", "}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mb-8">
                 {book.publishedYear && (
                   <div className="flex items-center gap-1.5 text-sm text-foreground bg-secondary px-3 py-1 rounded-full">
                     <Calendar className="w-4 h-4 text-muted-foreground" />
                     {book.publishedYear}
                   </div>
                 )}
              </div>

              <div className="space-y-8">
                 <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                   <div className="flex items-center justify-between mb-4 not-prose border-b pb-2">
                     <h3 className="font-medium text-foreground text-lg">Description</h3>
                   </div>
                   <div dangerouslySetInnerHTML={{ __html: '<p className="italic opacity-70">No description available.</p>' }} />
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
"""

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated", fpath)
