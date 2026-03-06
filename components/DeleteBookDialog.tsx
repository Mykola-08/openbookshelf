'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { pushUndoAction } from '@/lib/undo';

interface DeleteBookDialogProps {
  bookId: string;
  userBookId?: string;
  bookTitle: string;
}

export function DeleteBookDialog({ bookId, userBookId, bookTitle }: DeleteBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const supabase = createClient();

      if (userBookId) {
        // Remove user_books entry (keeps canonical book for other users)
        const { error } = await supabase
          .from('user_books')
          .delete()
          .eq('id', userBookId);

        if (error) {
          toast.error('Failed to remove book: ' + error.message);
          return;
        }

        pushUndoAction(`Removed "${bookTitle}" from library`, async () => {
          // Undo: re-create the user_books entry
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('user_books').insert({
            user_id: user.id,
            book_id: bookId,
            status: 'toread',
          });
          router.refresh();
        });
      } else {
        // If no user_book, delete the book record itself
        const { error } = await supabase
          .from('books')
          .delete()
          .eq('id', bookId);

        if (error) {
          toast.error('Failed to delete book: ' + error.message);
          return;
        }

        toast.success(`Deleted "${bookTitle}"`);
      }

      setOpen(false);
      router.push('/');
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full">
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Remove Book
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>&ldquo;{bookTitle}&rdquo;</strong> from your library? 
            This will delete your reading progress, notes, and shelving data for this book.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Remove from Library
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
