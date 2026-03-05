import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Book, LibrarySource, Shelf } from '@/types/library';
import { mockBooks, mockShelves, mockSources } from './mock-data';

interface AppState {
  books: Book[];
  shelves: Shelf[];
  sources: LibrarySource[];
  addBook: (book: Book) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  addShelf: (shelf: Shelf) => void;
  deleteShelf: (id: string) => void;
  updateSource: (id: string, updates: Partial<LibrarySource>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      books: mockBooks,
      shelves: mockShelves,
      sources: mockSources,
      addBook: (book) => set((state) => ({ books: [...state.books, book] })),
      updateBook: (id, updates) => set((state) => ({
        books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      })),
      deleteBook: (id) => set((state) => ({ books: state.books.filter((b) => b.id !== id) })),
      addShelf: (shelf) => set((state) => ({ shelves: [...state.shelves, shelf] })),
      deleteShelf: (id) => set((state) => ({ shelves: state.shelves.filter((s) => s.id !== id) })),
      updateSource: (id, updates) => set((state) => ({
        sources: state.sources.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
    }),
    {
      name: 'openbookshelf-storage',
    }
  )
);
