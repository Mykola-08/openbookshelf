// Matching Inbox Component
import { Book } from "@/types/library";
import { CheckCircle, AlertTriangle, ArrowRightLeft } from "@/components/ui/icons";

interface MatchItem {
    id: string; // Unique ID for key prop
    sourceBook: { 
        title: string; 
        author: string; 
        cover?: string; 
        sourceName: string 
    };
    localCandidate?: Book;
    confidence: number;
}

interface MatchingInboxProps {
  pendingMatches: MatchItem[];
}

export default function MatchingInbox({ pendingMatches }: MatchingInboxProps) {
  if (pendingMatches.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm mb-6">
      <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <ArrowRightLeft className="w-4 h-4 text-primary" />
          Review Incoming Books
          <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{pendingMatches.length}</span>
        </h3>
        <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          Dismiss All
        </button>
      </div>
      
      <div className="divide-y divide-border">
        {pendingMatches.map((match) => (
          <div key={match.id} className="p-4 flex gap-4 items-center hover:bg-secondary/30 transition-colors">
            {/* Source Item */}
            <div className="flex-1 flex gap-3 items-center min-w-0">
               <div className="w-10 h-14 bg-muted rounded shrink-0 overflow-hidden shadow-sm border border-border">
                 {match.sourceBook.cover ? 
                    <img src={match.sourceBook.cover} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground/50">?</div>
                 }
               </div>
               <div className="min-w-0">
                 <div className="text-[10px] text-muted-foreground/50 mb-0.5 uppercase tracking-wide font-medium">From {match.sourceBook.sourceName}</div>
                 <div className="font-semibold text-foreground text-sm truncate" title={match.sourceBook.title}>{match.sourceBook.title}</div>
                 <div className="text-xs text-muted-foreground truncate">{match.sourceBook.author}</div>
               </div>
            </div>

            {/* Match Status/Action */}
            <div className="shrink-0 flex flex-col items-center px-2 w-24">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${match.confidence > 80 ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground border border-border'}`}>
                {match.confidence}% Match
              </span>
              <div className="h-px w-full bg-border my-1 relative">
                <ArrowRightLeft className="w-3 h-3 text-muted-foreground/50 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card" />
              </div>
            </div>

            {/* Local Candidate or "New" */}
            <div className="flex-1 flex gap-3 items-center justify-end text-right min-w-0">
               {match.localCandidate ? (
                 <>
                    <div className="min-w-0">
                        <div className="text-[10px] text-primary mb-0.5 uppercase tracking-wide font-medium">Update Existing</div>
                        <div className="font-semibold text-foreground text-sm truncate">{match.localCandidate.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{match.localCandidate.authors[0]}</div>
                    </div>
                    <div className="w-10 h-14 bg-muted rounded shrink-0 overflow-hidden shadow-sm border border-border">
                        {match.localCandidate.coverUrl && <img src={match.localCandidate.coverUrl} className="w-full h-full object-cover" alt="" />}
                    </div>
                 </>
               ) : (
                  <div className="text-muted-foreground/50 text-sm italic pr-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground font-bold">+</span>
                    Create New
                  </div>
               )}
            </div>

            {/* Actions */}
            <div className="shrink-0 flex gap-1 pl-4 border-l border-border">
               <button className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Confirm" aria-label="Confirm match">
                 <CheckCircle className="w-6 h-6" />
               </button>
               <button className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Ignore" aria-label="Ignore match">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
