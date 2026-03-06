'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { BookOpen, CheckCircle2, Bookmark, Flame, GripVertical, Minus, Plus, LayoutGrid, List, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface TrackerBook {
  id: string; // user_book id
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string;
  progress?: number;
  status: string;
}

interface TrackerBoardProps {
  initialBooks: TrackerBook[];
}

const STATUS_COLUMNS = [
  { id: 'reading', label: 'Currently Reading', icon: Flame, iconColor: 'text-status-warning' },
  { id: 'toread', label: 'Plan to Read', icon: Bookmark, iconColor: 'text-status-info' },
  { id: 'finished', label: 'Completed', icon: CheckCircle2, iconColor: 'text-status-success' },
] as const;

export function TrackerBoard({ initialBooks }: TrackerBoardProps) {
  const [books, setBooks] = useState(initialBooks);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [compact, setCompact] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const router = useRouter();

  const filteredBooks = searchFilter.trim()
    ? books.filter(b =>
        b.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        b.author.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : books;

  const getColumnBooks = (status: string) => filteredBooks.filter(b => b.status === status);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedId) return;

    const book = books.find(b => b.id === draggedId);
    if (!book || book.status === targetStatus) {
      setDraggedId(null);
      return;
    }

    // Optimistic update
    setBooks(prev => prev.map(b => b.id === draggedId ? { ...b, status: targetStatus } : b));
    setDraggedId(null);

    startTransition(async () => {
      const supabase = createClient();
      const updateData: any = { status: targetStatus, updated_at: new Date().toISOString() };
      if (targetStatus === 'finished') {
        updateData.finished_at = new Date().toISOString();
        updateData.progress = 100;
      }
      if (targetStatus === 'reading' && !book.progress) {
        updateData.started_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_books')
        .update(updateData)
        .eq('id', draggedId);

      if (error) {
        toast.error('Failed to update status');
        setBooks(prev => prev.map(b => b.id === draggedId ? { ...b, status: book.status } : b));
      } else {
        toast.success(`Moved "${book.title}" to ${STATUS_COLUMNS.find(c => c.id === targetStatus)?.label}`);
        router.refresh();
      }
    });
  };

  const handleProgressChange = (userBookId: string, delta: number) => {
    const book = books.find(b => b.id === userBookId);
    if (!book) return;
    const newProgress = Math.max(0, Math.min(100, (book.progress || 0) + delta));

    setBooks(prev => prev.map(b => b.id === userBookId ? { ...b, progress: newProgress } : b));

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_books')
        .update({ progress: newProgress, updated_at: new Date().toISOString() })
        .eq('id', userBookId);

      if (error) {
        toast.error('Failed to update progress');
        setBooks(prev => prev.map(b => b.id === userBookId ? { ...b, progress: book.progress } : b));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Filter by title or author..."
            className="pl-9 h-9 rounded-full bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-border"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <Button
            size="sm"
            variant={!compact ? 'default' : 'ghost'}
            className="h-7 px-2.5 rounded-md"
            onClick={() => setCompact(false)}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant={compact ? 'default' : 'ghost'}
            className="h-7 px-2.5 rounded-md"
            onClick={() => setCompact(true)}
          >
            <List className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {STATUS_COLUMNS.map((col) => {
        const colBooks = getColumnBooks(col.id);
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className={`flex flex-col space-y-4 p-3 rounded-xl transition-colors ${
              dragOverCol === col.id ? 'bg-primary/5 ring-2 ring-primary/20' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-foreground flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.iconColor}`} /> {col.label}
              </h2>
              <Badge variant="secondary" className="rounded-full px-2">{colBooks.length}</Badge>
            </div>

            <div className="space-y-3 flex-1 min-h-[100px]">
              {colBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border border-dashed text-muted-foreground text-sm">
                  <Bookmark className="w-6 h-6 mb-2 opacity-20" />
                  Drop books here
                </div>
              ) : compact ? (
                /* Compact mode */
                colBooks.map((book) => (
                  <div
                    key={book.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, book.id)}
                    className={`group flex items-center gap-3 rounded-lg border bg-card/50 px-3 py-2 transition-all hover:bg-card cursor-grab active:cursor-grabbing ${
                      draggedId === book.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    <Link href={`/book/${book.bookId}`} className="font-medium text-sm text-foreground truncate hover:text-primary transition-colors flex-1 min-w-0">
                      {book.title}
                    </Link>
                    <span className="text-xs text-muted-foreground truncate shrink-0 max-w-[100px]">{book.author}</span>
                    {col.id === 'reading' && (
                      <span className="text-xs text-muted-foreground font-mono tabular-nums shrink-0">{book.progress || 0}%</span>
                    )}
                  </div>
                ))
              ) : (
                colBooks.map((book) => (
                  <div
                    key={book.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, book.id)}
                    className={`group relative overflow-hidden rounded-xl border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-sm cursor-grab active:cursor-grabbing ${
                      draggedId === book.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Link href={`/book/${book.bookId}`} className="h-20 w-14 overflow-hidden rounded-md bg-muted shrink-0 shadow-sm">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                        <Link href={`/book/${book.bookId}`} className="font-medium text-foreground truncate hover:text-primary transition-colors">
                          {book.title}
                        </Link>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{book.author}</p>

                        {col.id === 'reading' && (
                          <div className="mt-2 flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => { e.preventDefault(); handleProgressChange(book.id, -10); }}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${book.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground font-mono tabular-nums w-8 text-right">{book.progress || 0}%</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => { e.preventDefault(); handleProgressChange(book.id, 10); }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
