import { Book, LibrarySource } from "@/types/library";
import StatusPill from "./StatusPill";
import SourceBadge from "./SourceBadge";
import { CheckCircle, AlertTriangle, Lock, RefreshCw, Star } from "@/components/ui/icons";

interface BookCardProps {
  book: Book;
  source?: LibrarySource;
}

export default function BookCard({ book, source }: BookCardProps) {
  const SyncIcon = () => {
    const iconClass = "w-3 h-3";
    switch (book.syncState) {
      case 'synced': return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'pending': return <RefreshCw className={`${iconClass} text-yellow-600`} />;
      case 'locked': return <Lock className={`${iconClass} text-gray-500`} />;
      case 'conflict': return <AlertTriangle className={`${iconClass} text-red-600`} />;
      default: return null;
    }
  };

  return (
    <div className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[2/3] bg-gray-100 relative">
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Cover
          </div>
        )}
        
        {/* Status Overlay on hover or always? Let's keep it visible per design usually */}
        <div className="absolute top-2 right-2">
          {source && <SourceBadge source={source} />}
        </div>
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur rounded px-1.5 py-1 text-xs shadow-sm flex items-center justify-center">
           <SyncIcon />
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight mb-1" title={book.title}>
          {book.title}
        </h3>
        <p className="text-gray-500 text-xs mb-2 truncate">
          {book.authors.join(", ")}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <StatusPill status={book.status.toLowerCase()} />
          {book.rating ? (
             <div className="flex items-center gap-0.5">
               <span className="text-xs font-medium text-gray-600">{book.rating}</span>
               <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
             </div>
          ) : null}
        </div>

        {/* Progress bar if reading */}
        {book.status === 'reading' && book.progress !== undefined && (
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full" 
              style={{ width: `${Math.min(book.progress, 100)}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
