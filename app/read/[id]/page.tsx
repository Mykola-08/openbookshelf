import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ReaderWrapper } from "@/components/ReaderWrapper";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // Fetch the file URL for this book
  const { data: file } = await supabase
    .from('book_files')
    .select('file_url')
    .eq('book_id', id)
    .eq('format', 'epub')
    .maybeSingle();

  if (!file || !file.file_url) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <h2 className="text-2xl font-bold mb-4">No readable file found</h2>
            <p className="text-gray-500 mb-6">This book does not have an associated EPUB file in the library.</p>
            <Button asChild>
                <Link href={`/book/${id}`}>Back to Book</Link>
            </Button>
        </div>
     );
  }

  // Fetch the book title for the header
  const { data: book } = await supabase
    .from('books')
    .select('title')
    .eq('id', id)
    .single();

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden m-0 p-0 absolute inset-0 z-[100] bg-background">
      <ReaderWrapper 
        url={file.file_url} 
        bookId={id} 
        title={book?.title || "Reading"} 
      />
    </div>
  );
}
