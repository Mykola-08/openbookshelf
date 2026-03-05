import { Book, LibrarySource, Shelf } from "@/types/library";

export const mockSources: LibrarySource[] = [
  {
    id: 'src-1',
    name: 'Open Library (Profile)',
    type: 'public_url',
    url: 'https://openlibrary.org/people/johndoe',
    lastSync: new Date('2025-03-01T10:00:00Z'),
    policy: {
      syncMode: 'pull-only',
      automation: 'ask',
      conflictRule: 'ask',
      trustLevel: 'medium'
    },
    fieldPolicy: {
      status: 'ask',
      shelves: 'ask',
      progress: 'manual',
      rating: 'manual'
    }
  },
  {
    id: 'src-2',
    name: 'Kindle Sync',
    type: 'private_api',
    url: 'https://amazon.com/kindle',
    lastSync: new Date('2025-03-04T08:00:00Z'),
    policy: {
      syncMode: 'two-way',
      automation: 'auto',
      conflictRule: 'app-wins',
      trustLevel: 'high'
    },
    fieldPolicy: {
      status: 'auto',
      shelves: 'auto',
      progress: 'auto',
      rating: 'auto'
    }
  }
];

export const mockShelves: Shelf[] = [
  { id: 'shelf-1', name: 'Must Read', count: 12 },
  { id: 'shelf-2', name: 'Sci-Fi Classics', count: 45 },
  { id: 'shelf-3', name: 'Design Books', count: 8 },
];

export const mockBooks: Book[] = [
  {
    id: 'book-1',
    title: 'Design Systems',
    authors: ['Alla Kholmatova'],
    status: 'reading',
    progress: 45,
    coverUrl: 'https://covers.openlibrary.org/b/id/8258381-M.jpg',
    shelves: ['Design Books'],
    sourceId: 'src-1',
    externalIds: { 'src-1': 'OL12345' },
    syncState: 'synced',
    publishedYear: 2017
  },
  {
    id: 'book-2',
    title: 'The Pragmatic Programmer',
    authors: ['David Thomas', 'Andrew Hunt'],
    status: 'finished',
    rating: 5,
    coverUrl: 'https://covers.openlibrary.org/b/id/12555624-M.jpg',
    shelves: ['Must Read'],
    sourceId: 'src-2',
    externalIds: { 'src-2': 'KINDLE_ID_1' },
    syncState: 'synced',
    publishedYear: 2019
  },
  {
    id: 'book-3',
    title: 'Dune',
    authors: ['Frank Herbert'],
    status: 'toread',
    coverUrl: 'https://covers.openlibrary.org/b/id/14532298-M.jpg',
    shelves: ['Sci-Fi Classics'],
    sourceId: 'src-1',
    externalIds: { 'src-1': 'OL98765' },
    syncState: 'conflict',
    publishedYear: 1965
  },
  {
    id: 'book-4',
    title: 'The Manager\'s Path',
    authors: ['Camille Fournier'],
    status: 'abandoned',
    coverUrl: 'https://covers.openlibrary.org/b/id/8389659-M.jpg',
    shelves: ['Must Read'],
    sourceId: 'src-2',
    externalIds: { 'src-2': 'KINDLE_ID_2' },
    syncState: 'pending', // Pending review
    publishedYear: 2017
  },
];
