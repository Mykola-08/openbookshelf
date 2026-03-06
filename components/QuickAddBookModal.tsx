'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, BookOpen, Search, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AddMode = 'manual' | 'isbn' | 'opds';

export function QuickAddBookModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AddMode>('manual');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Manual fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('toread');

  // ISBN lookup
  const [isbnQuery, setIsbnQuery] = useState('');
  const [isbnResult, setIsbnResult] = useState<any>(null);
  const [isbnSearching, setIsbnSearching] = useState(false);

  // OPDS
  const [opdsUrl, setOpdsUrl] = useState('');

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setIsbn('');
    setYear('');
    setStatus('toread');
    setIsbnQuery('');
    setIsbnResult(null);
    setOpdsUrl('');
    setMode('manual');
  };

  const searchISBN = async () => {
    if (!isbnQuery.trim()) return;
    setIsbnSearching(true);
    try {
      const res = await fetch(`https://openlibrary.org/isbn/${isbnQuery.trim().replace(/-/g, '')}.json`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      
      // Get author names
      let authorNames: string[] = [];
      if (data.authors) {
        const authorPromises = data.authors.map(async (a: any) => {
          try {
            const ar = await fetch(`https://openlibrary.org${a.key}.json`);
            const ad = await ar.json();
            return ad.name || 'Unknown';
          } catch { return 'Unknown'; }
        });
        authorNames = await Promise.all(authorPromises);
      }

      setIsbnResult({
        title: data.title,
        authors: authorNames,
        isbn13: data.isbn_13?.[0],
        isbn10: data.isbn_10?.[0],
        publishedYear: data.publish_date ? parseInt(data.publish_date) || null : null,
        coverUrl: data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg` : null,
        pageCount: data.number_of_pages,
      });
    } catch {
      toast.error('Could not find a book with that ISBN');
      setIsbnResult(null);
    } finally {
      setIsbnSearching(false);
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add books');
        return;
      }

      let bookData: any;

      if (mode === 'isbn' && isbnResult) {
        bookData = {
          title: isbnResult.title,
          authors: isbnResult.authors,
          isbn13: isbnResult.isbn13,
          isbn10: isbnResult.isbn10,
          published_year: isbnResult.publishedYear,
          cover_url: isbnResult.coverUrl,
          page_count: isbnResult.pageCount,
        };
      } else if (mode === 'manual') {
        if (!title.trim()) {
          toast.error('Title is required');
          return;
        }
        bookData = {
          title: title.trim(),
          authors: author.trim() ? [author.trim()] : ['Unknown'],
          isbn13: isbn.trim() || null,
          published_year: year ? parseInt(year) : null,
        };
      } else if (mode === 'opds') {
        toast.info('OPDS import: use the Connections page to add OPDS sources');
        setOpen(false);
        router.push('/connections/add');
        return;
      }

      // Insert book
      const { data: insertedBook, error: bookError } = await supabase
        .from('books')
        .insert(bookData)
        .select('id')
        .single();

      if (bookError) {
        toast.error('Failed to create book: ' + bookError.message);
        return;
      }

      // Create user_books entry
      const { error: ubError } = await supabase
        .from('user_books')
        .insert({
          user_id: user.id,
          book_id: insertedBook.id,
          status: status,
        });

      if (ubError) {
        toast.error('Book created but failed to add to library: ' + ubError.message);
        return;
      }

      toast.success(`"${bookData.title}" added to your library`);
      resetForm();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-full shadow-sm">
          <Plus className="w-4 h-4" />
          Add Book
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Add a Book
          </DialogTitle>
          <DialogDescription>
            Add a book to your library manually, by ISBN lookup, or via OPDS URL.
          </DialogDescription>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          {([
            { id: 'manual' as const, label: 'Manual', icon: Plus },
            { id: 'isbn' as const, label: 'ISBN Lookup', icon: Search },
            { id: 'opds' as const, label: 'OPDS URL', icon: Link2 },
          ]).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 px-3 rounded-md transition-colors ${
                mode === m.id
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 mt-2">
          {mode === 'manual' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Book title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input id="author" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input id="isbn" value={isbn} onChange={e => setIsbn(e.target.value)} placeholder="ISBN-13 or ISBN-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g., 2024" type="number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Initial Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toread">To Read</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {mode === 'isbn' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="isbn-search">ISBN</Label>
                <div className="flex gap-2">
                  <Input
                    id="isbn-search"
                    value={isbnQuery}
                    onChange={e => setIsbnQuery(e.target.value)}
                    placeholder="Enter ISBN-13 or ISBN-10"
                    onKeyDown={e => e.key === 'Enter' && searchISBN()}
                  />
                  <Button variant="secondary" onClick={searchISBN} disabled={isbnSearching} className="shrink-0">
                    {isbnSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {isbnResult && (
                <div className="border rounded-xl p-4 bg-muted/30 flex gap-4">
                  {isbnResult.coverUrl && (
                    <img src={isbnResult.coverUrl} alt="" className="w-16 h-24 object-cover rounded shadow-sm" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{isbnResult.title}</p>
                    <p className="text-sm text-muted-foreground">{isbnResult.authors?.join(', ')}</p>
                    {isbnResult.publishedYear && (
                      <p className="text-xs text-muted-foreground mt-1">Published: {isbnResult.publishedYear}</p>
                    )}
                    {isbnResult.pageCount && (
                      <p className="text-xs text-muted-foreground">{isbnResult.pageCount} pages</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Initial Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toread">To Read</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {mode === 'opds' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opds-url">OPDS Feed URL</Label>
                <Input id="opds-url" value={opdsUrl} onChange={e => setOpdsUrl(e.target.value)} placeholder="https://example.com/opds" />
              </div>
              <p className="text-sm text-muted-foreground">
                To import books from an OPDS source, add it as a connection first. You&apos;ll be redirected to the connections page.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || (mode === 'manual' && !title.trim()) || (mode === 'isbn' && !isbnResult)}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {mode === 'opds' ? 'Go to Connections' : 'Add to Library'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
