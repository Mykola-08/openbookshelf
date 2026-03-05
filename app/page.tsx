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
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4 md:px-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mr-12 tracking-tight flex items-center gap-2">
           <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
           OpenBookshelf
        </h1>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link href="/" className="text-blue-600 font-semibold border-b-2 border-blue-600 py-5">Library</Link>
            <Link href="/connections" className="text-gray-500 hover:text-gray-900 transition-colors py-5 border-b-2 border-transparent hover:border-gray-200">Connections</Link>
            <Link href="/settings" className="text-gray-500 hover:text-gray-900 transition-colors py-5 border-b-2 border-transparent hover:border-gray-200">Settings</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search books..." 
                  className="pl-9 pr-4 py-1.5 bg-gray-100 border-none rounded-full text-sm w-48 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                />
             </div>
             <button className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs ring-1 ring-blue-100 transition-colors">
                <User className="w-4 h-4" />
             </button>
        </div>
      </header>


      <div className="pt-24 px-4 md:px-8 pb-12 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
          
        {/* Sidebar / Filters */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Library</h3>
            <ul className="space-y-1">
              <li className="flex justify-between items-center text-sm font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-md">
                <span>All Books</span>
                <span className="text-blue-500 text-xs bg-blue-100 px-1.5 py-0.5 rounded-full">{mockBooks.length}</span>
              </li>
              <li className="flex justify-between items-center text-sm text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md cursor-pointer transition-colors">
                <span>To Read</span>
                <span className="text-gray-400 text-xs">8</span>
              </li>
              <li className="flex justify-between items-center text-sm text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md cursor-pointer transition-colors">
                <span>Reading</span>
                <span className="text-gray-400 text-xs">2</span>
              </li>
              <li className="flex justify-between items-center text-sm text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md cursor-pointer transition-colors">
                <span>Finished</span>
                <span className="text-gray-400 text-xs">42</span>
              </li>
            </ul>
          </div>
          
           <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Shelves</h3>
            <ul className="space-y-1">
               {mockShelves.map(shelf => (
                  <li key={shelf.id} className="flex justify-between items-center text-sm text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md cursor-pointer transition-colors">
                    <span>{shelf.name}</span>
                    <span className="text-gray-400 text-xs">{shelf.count}</span>
                  </li>
               ))}
            </ul>
           </div>
        </aside>

        {/* Content */}
        <main className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">All Books</h1>
            <div className="flex gap-3">
               <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-all">
                 <Filter className="w-4 h-4 text-gray-500" />
                 Filters
               </button>
               <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-blue-500">
                 <Plus className="w-4 h-4" />
                 Add Book
               </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
             {mockBooks.map(book => (
              <BookCard key={book.id} book={book} source={getSource(book.sourceId)} />
            ))}
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Inbox</h2>
          {/* @ts-ignore */}
          <MatchingInbox pendingMatches={mockMatches} />
        </main>
      </div>
    </div>
  );
}
