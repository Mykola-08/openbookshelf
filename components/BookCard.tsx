import { Book, LibrarySource } from "@/types/library";
import StatusPill from "./StatusPill";
import SourceBadge from "./SourceBadge";
import { CheckCircle, AlertTriangle, Lock, RefreshCw, Star } from "@/components/ui/icons";

interface BookCardProps {
  book: Book;
  source?: LibrarySource;
}


const SyncIcon = ({ syncState }: { syncState: string | undefined }) => {
  const iconClass = "w-3 h-3";
  switch (syncState) {
    case 'synced': return <CheckCircle className={`${iconClass} text-green-600`} />;
    case 'pending': return <RefreshCw className={`${iconClass} text-yellow-600`} />;
    case 'locked': return <Lock className={`${iconClass} text-gray-500`} />;
    case 'conflict': return <AlertTriangle className={`${iconClass} text-red-600`} />;
    default: return null;
  }
};

export default function BookCard({ book, source }: BookCardProps) {
  

  return (
    <div className="relative group bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="aspect-[2/3] bg-muted relative">
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={book.coverUrl} 
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm font-medium">
            No Cover
          </div>
        )}
        
        {/* Status Overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
          {source && <SourceBadge source={source} />}
        </div>
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-md rounded-full p-1.5 shadow-sm text-foreground">
           <SyncIcon syncState={book.syncState} />
        </div>
      </div>
      
      <div className="p-3.5">
        <h3 className="font-medium text-foreground line-clamp-2 text-sm leading-snug mb-1" title={book.title}>
          {book.title}
        </h3>
        <p className="text-muted-foreground text-xs mb-3 truncate">
          {book.authors.join(", ")}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <StatusPill status={book.status.toLowerCase()} />
          {book.rating ? (
             <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded-md">
               <span className="text-xs font-semibold text-foreground">{book.rating}</span>
               <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
             </div>
          ) : null}
        </div>

        {/* Progress bar if reading */}
        {book.status === 'reading' && book.progress !== undefined && (
          <div className="mt-3 w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(book.progress, 100)}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
