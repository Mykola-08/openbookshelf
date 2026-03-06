'use client';

import { useState, useCallback, createContext, useContext, useTransition } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Trash2, FolderInput, ArrowRightLeft, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---- Context for selection state ----
interface BulkSelectionContextType {
  selected: Set<string>;
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearAll: () => void;
  isSelecting: boolean;
  setIsSelecting: (v: boolean) => void;
}

const BulkSelectionContext = createContext<BulkSelectionContextType>({
  selected: new Set(),
  toggle: () => {},
  selectAll: () => {},
  clearAll: () => {},
  isSelecting: false,
  setIsSelecting: () => {},
});

export function useBulkSelection() {
  return useContext(BulkSelectionContext);
}

export function BulkSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelected(new Set(ids));
  }, []);

  const clearAll = useCallback(() => {
    setSelected(new Set());
    setIsSelecting(false);
  }, []);

  return (
    <BulkSelectionContext.Provider value={{ selected, toggle, selectAll, clearAll, isSelecting, setIsSelecting }}>
      {children}
    </BulkSelectionContext.Provider>
  );
}

// ---- Floating bulk action bar ----
interface BulkActionBarProps {
  allIds: string[];
  onComplete?: () => void;
}

export function BulkActionBar({ allIds, onComplete }: BulkActionBarProps) {
  const { selected, selectAll, clearAll, isSelecting } = useBulkSelection();
  const [isPending, startTransition] = useTransition();

  if (!isSelecting || selected.size === 0) return null;

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const supabase = createClient();
      const ids = Array.from(selected);
      const { error } = await supabase
        .from('user_books')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) {
        toast.error('Failed to update status');
      } else {
        toast.success(`Moved ${ids.length} book(s) to "${newStatus}"`);
        clearAll();
        onComplete?.();
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const supabase = createClient();
      const ids = Array.from(selected);
      const { error } = await supabase
        .from('user_books')
        .delete()
        .in('id', ids);

      if (error) {
        toast.error('Failed to delete books');
      } else {
        toast.success(`Removed ${ids.length} book(s) from library`, {
          action: {
            label: 'Undo',
            onClick: () => {
              toast.info('Undo is not yet supported for bulk delete');
            },
          },
        });
        clearAll();
        onComplete?.();
      }
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-dialog)] bg-card border border-border shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <CheckSquare className="w-4 h-4 text-primary" />
        <span>{selected.size} selected</span>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => selectAll(allIds)}
        >
          Select All ({allIds.length})
        </Button>

        <Select onValueChange={handleStatusChange} disabled={isPending}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3 h-3" />
              <SelectValue placeholder="Move to..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toread">To Read</SelectItem>
            <SelectItem value="reading">Reading</SelectItem>
            <SelectItem value="finished">Finished</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="destructive"
          className="text-xs gap-1"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={clearAll}>
        <X className="w-3 h-3" />
        Cancel
      </Button>
    </div>
  );
}
