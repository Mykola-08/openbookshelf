'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Pencil, X, Save, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';

interface EditableMetadataProps {
  bookId: string;
  userBookId?: string;
  initialData: {
    title: string;
    description: string | null;
    publishedYear: number | null;
    isbn13: string | null;
    coverUrl: string | null;
    authors: string[];
    status: string;
    rating: number | null;
    notes: string | null;
    progress: number | null;
  };
}

export function EditableMetadataPanel({ bookId, userBookId, initialData }: EditableMetadataProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description || '');
  const [year, setYear] = useState(initialData.publishedYear?.toString() || '');
  const [isbn, setIsbn] = useState(initialData.isbn13 || '');
  const [coverUrl, setCoverUrl] = useState(initialData.coverUrl || '');
  const [authorsStr, setAuthorsStr] = useState(initialData.authors.join(', '));
  const [status, setStatus] = useState(initialData.status);
  const [rating, setRating] = useState(initialData.rating || 0);
  const [notes, setNotes] = useState(initialData.notes || '');
  const [progress, setProgress] = useState(initialData.progress?.toString() || '0');

  const handleSave = () => {
    startTransition(async () => {
      const supabase = createClient();

      // Update book metadata
      const { error: bookErr } = await supabase
        .from('books')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          published_year: year ? parseInt(year) : null,
          isbn13: isbn.trim() || null,
          cover_url: coverUrl.trim() || null,
          authors: authorsStr.split(',').map(a => a.trim()).filter(Boolean),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookId);

      if (bookErr) {
        toast.error('Failed to update book: ' + bookErr.message);
        return;
      }

      // Update user_books if we have one
      if (userBookId) {
        const { error: ubErr } = await supabase
          .from('user_books')
          .update({
            status,
            rating: rating || null,
            notes: notes.trim() || null,
            progress: progress ? parseInt(progress) : 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userBookId);

        if (ubErr) {
          toast.error('Failed to update reading data: ' + ubErr.message);
          return;
        }
      }

      toast.success('Book updated');
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader className="pb-4 border-b border-border/40">
          <SheetTitle>Edit Book Metadata</SheetTitle>
          <SheetDescription>
            Update book information and your personal reading data.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 px-1">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-authors">Authors (comma-separated)</Label>
            <Input id="edit-authors" value={authorsStr} onChange={e => setAuthorsStr(e.target.value)} placeholder="Author One, Author Two" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-year">Published Year</Label>
              <Input id="edit-year" value={year} onChange={e => setYear(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-isbn">ISBN-13</Label>
              <Input id="edit-isbn" value={isbn} onChange={e => setIsbn(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cover">Cover URL</Label>
            <Input id="edit-cover" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." />
            {coverUrl && (
              <img src={coverUrl} alt="Preview" className="mt-2 w-20 h-28 object-cover rounded shadow-sm border" />
            )}
          </div>

          {userBookId && (
            <>
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Your Reading Data</h4>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toread">To Read</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRating(rating === v ? 0 : v)}
                      className="p-1 transition-colors"
                    >
                      <Star className={`w-6 h-6 ${v <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-progress">Progress (%)</Label>
                <Input id="edit-progress" value={progress} onChange={e => setProgress(e.target.value)} type="number" min="0" max="100" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <textarea
                  id="edit-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Your personal notes about this book..."
                />
              </div>
            </>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending || !title.trim()}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
