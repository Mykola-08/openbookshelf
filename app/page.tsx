import { mockBooks, mockShelves, mockSources } from "@/lib/mock-data";
import BookCard from "@/components/BookCard";
import MatchingInbox from "@/components/MatchingInbox";
import Link from "next/link";
import { Book } from "@/types/library";
import { Search, User, Filter, Plus } from "@/components/ui/icons";

export default function Home() {
  const getSource = (id?: string) => mockSources.find(s => s.id === id);

  // MOCK MATCHING DATA
  const mockMatches = [
    {
       id: 'm1',
       sourceBook: { 
         title: "Atomic Habits", 
         author: "James Clear", 
         sourceName: "Kindle Sync",
         cover: "https://covers.openlibrary.org/b/id/10515124-M.jpg"
       },
       confidence: 100
    },
    {
       id: 'm2',
       sourceBook: { 
         title: "Dune Messiah", 
         author: "Frank Herbert", 
         sourceName: "Open Library",
         cover: "https://covers.openlibrary.org/b/id/12571731-M.jpg"
       },
       localCandidate: mockBooks.find(b => b.title === 'Dune'), // Wrong match simulation for UI
       confidence: 45
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 pb-12 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
          
        {/* Sidebar / Filters */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-8 md:sticky md:top-24 h-max">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">Your Library</h3>
            <ul className="space-y-1">
              <li className="flex justify-between items-center text-sm font-medium text-primary bg-primary/10 px-3 py-2 rounded-md">
                <span>All Books</span>
                <span className="text-primary text-xs bg-background px-1.5 py-0.5 rounded-full">{mockBooks.length}</span>
              </li>
              <li className="flex justify-between items-center text-sm text-foreground hover:bg-muted/50 px-3 py-2 rounded-md cursor-pointer transition-colors">
                <span>To Read</span>
                <span className="text-muted-foreground text-xs">8</span>
              </li>
              <li className="flex justify-between items-center text-sm text-foreground hover:bg-muted/50 px-3 py-2 rounded-md cursor-pointer transition-colors">
                <span>Reading</span>
                <span className="text-muted-foreground text-xs">2</span>
              </li>
              <li className="flex justify-between items-center text-sm text-foreground hover:bg-muted/50 px-3 py-2 rounded-md cursor-pointer transition-colors">
                <span>Finished</span>
                <span className="text-muted-foreground text-xs">42</span>
              </li>
            </ul>
          </div>
          
           <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">Shelves</h3>
            <ul className="space-y-1">
               {mockShelves.map(shelf => (
                  <li key={shelf.id} className="flex justify-between items-center text-sm text-foreground hover:bg-muted/50 px-3 py-2 rounded-md cursor-pointer transition-colors">
                    <span>{shelf.name}</span>
                    <span className="text-muted-foreground text-xs">{shelf.count}</span>
                  </li>
               ))}
            </ul>
           </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">All Books</h1>
            <div className="flex gap-3">
               <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-full hover:bg-muted shadow-sm transition-all">
                 <Filter className="w-4 h-4 text-muted-foreground" />
                 Filters
               </button>
               <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-full hover:bg-primary/90 shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-ring">
                 <Plus className="w-4 h-4" />
                 Add Book
               </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
             {mockBooks.map(book => (
              <span key={book.id} className="block transition-transform hover:-translate-y-1 duration-200">
                <BookCard book={book} source={getSource(book.sourceId)} />
              </span>
            ))}
          </div>

          <div className="pt-8 border-t">
            <h2 className="text-xl font-semibold text-foreground mb-6">Pending Inbox</h2>
            {/* @ts-ignore */}
            <MatchingInbox pendingMatches={mockMatches} />
          </div>
        </main>
      </div>
    </div>
  );
}
