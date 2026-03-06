'use client';

import { toast } from 'sonner';

interface UndoEntry {
  id: string;
  description: string;
  undo: () => Promise<void>;
  expiresAt: number;
}

const UNDO_WINDOW_MS = 8000;
let undoStack: UndoEntry[] = [];

export function pushUndoAction(description: string, undoFn: () => Promise<void>) {
  const entry: UndoEntry = {
    id: crypto.randomUUID(),
    description,
    undo: undoFn,
    expiresAt: Date.now() + UNDO_WINDOW_MS,
  };

  undoStack.push(entry);

  toast.success(description, {
    duration: UNDO_WINDOW_MS,
    action: {
      label: 'Undo',
      onClick: async () => {
        try {
          await entry.undo();
          toast.info('Action undone');
          undoStack = undoStack.filter(e => e.id !== entry.id);
        } catch {
          toast.error('Failed to undo');
        }
      },
    },
  });

  // Clean up expired entries
  setTimeout(() => {
    undoStack = undoStack.filter(e => e.expiresAt > Date.now());
  }, UNDO_WINDOW_MS + 1000);
}
