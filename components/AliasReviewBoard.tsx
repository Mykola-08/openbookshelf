"use client";
import { toast } from 'sonner';

import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, X, ThumbsUp, ThumbsDown, Filter, BookOpen, ExternalLink, CheckSquare, Square } from "lucide-react";
import { voteAliasAction } from "@/app/actions/alias-vote";
import Link from "next/link";

export interface AliasReviewItem {
  id: string;
  aliasTitle?: string;
  alias_title?: string;
  sourceText?: string;
  canonicalBookId?: string;
  canonicalBookTitle?: string;
  status?: string;
  yesVotes?: number;
  noVotes?: number;
  origin_source_name?: string | null;
  originSourceName?: string | null;
  originRemoteId?: string | null;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export function AliasReviewBoard({ items }: { items: AliasReviewItem[] }) {
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [localVotes, setLocalVotes] = useState<Record<string, { yes: number; no: number; status: string }>>({});
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  if (items.length === 0) return <p className="text-muted-foreground text-sm py-4">No pending alias reviews.</p>;

  const handleVote = async (id: string, isSame: boolean) => {
    try {
      setLoading(prev => new Set([...prev, id]));
      const result = await voteAliasAction(id, isSame);
      if (result.success) {
        toast.success(isSame ? "Voted: same book" : "Voted: different book");
        setLocalVotes(prev => ({
          ...prev,
          [id]: {
            yes: result.yesVotes ?? 0,
            no: result.noVotes ?? 0,
            status: result.status ?? 'pending'
          }
        }));
        setReviewed(prev => new Set([...prev, id]));
      } else {
        toast.error("Failed to vote: " + result.error);
      }
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setLoading(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getItemStatus = (item: AliasReviewItem) => localVotes[item.id]?.status || item.status || 'pending';
  const getYesVotes = (item: AliasReviewItem) => localVotes[item.id]?.yes ?? item.yesVotes ?? 0;
  const getNoVotes = (item: AliasReviewItem) => localVotes[item.id]?.no ?? item.noVotes ?? 0;
  const getTitle = (item: AliasReviewItem) => item.aliasTitle || item.alias_title || item.sourceText || 'Unknown';
  const getSource = (item: AliasReviewItem) => item.originSourceName || item.origin_source_name || 'Unknown';

  const filteredItems = filter === 'all' ? items : items.filter(item => getItemStatus(item) === filter);
  const statusCounts = {
    all: items.length,
    pending: items.filter(i => getItemStatus(i) === 'pending').length,
    approved: items.filter(i => getItemStatus(i) === 'approved').length,
    rejected: items.filter(i => getItemStatus(i) === 'rejected').length,
  };

  // Batch selection helpers
  const pendingItems = filteredItems.filter(i => getItemStatus(i) === 'pending' && !reviewed.has(i.id));
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const selectAllPending = () => setSelected(new Set(pendingItems.map(i => i.id)));
  const clearSelection = () => setSelected(new Set());
  const selectedPendingCount = [...selected].filter(id => pendingItems.some(i => i.id === id)).length;

  const handleBatchVote = async (isSame: boolean) => {
    const idsToVote = [...selected].filter(id => pendingItems.some(i => i.id === id));
    if (idsToVote.length === 0) return;
    setBatchLoading(true);
    let successCount = 0;
    for (const id of idsToVote) {
      try {
        const result = await voteAliasAction(id, isSame);
        if (result.success) {
          successCount++;
          setLocalVotes(prev => ({
            ...prev,
            [id]: { yes: result.yesVotes ?? 0, no: result.noVotes ?? 0, status: result.status ?? 'pending' }
          }));
          setReviewed(prev => new Set([...prev, id]));
        }
      } catch { /* skip failed */ }
    }
    setBatchLoading(false);
    setSelected(new Set());
    toast.success(`Batch voted ${successCount} alias${successCount !== 1 ? 'es' : ''} as "${isSame ? 'Same' : 'Different'}"`);
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            className="capitalize gap-1.5 rounded-full text-xs h-8"
            onClick={() => setFilter(f)}
          >
            {f} <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 rounded-full">{statusCounts[f]}</Badge>
          </Button>
        ))}
      </div>

      {/* Batch Actions Bar */}
      {pendingItems.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap bg-muted/40 rounded-lg p-3 border">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs h-8"
            onClick={selectedPendingCount === pendingItems.length ? clearSelection : selectAllPending}
          >
            {selectedPendingCount === pendingItems.length ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {selectedPendingCount > 0 ? `${selectedPendingCount} selected` : 'Select All'}
          </Button>
          {selectedPendingCount > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => handleBatchVote(true)}
                disabled={batchLoading}
              >
                <Check className="w-3.5 h-3.5" /> Batch: Same
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleBatchVote(false)}
                disabled={batchLoading}
              >
                <X className="w-3.5 h-3.5" /> Batch: Different
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-8" onClick={clearSelection}>
                Clear
              </Button>
            </>
          )}
        </div>
      )}

      {/* Alias cards */}
      <div className="space-y-3">
        {filteredItems.map(item => {
          const isVoting = loading.has(item.id);
          const wasReviewed = reviewed.has(item.id);
          const status = getItemStatus(item);
          const yesVotes = getYesVotes(item);
          const noVotes = getNoVotes(item);

          return (
            <div key={item.id} className={`p-4 rounded-xl border bg-card transition-all ${wasReviewed ? 'opacity-60' : ''} ${selected.has(item.id) ? 'ring-2 ring-primary/50 border-primary/30' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Selection checkbox */}
                    {status === 'pending' && !wasReviewed && (
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={selected.has(item.id) ? 'Deselect alias' : 'Select alias'}
                      >
                        {selected.has(item.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    )}
                    <span className="font-semibold text-foreground">{getTitle(item)}</span>
                    <Badge
                      variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}
                      className="text-[10px] uppercase tracking-wider rounded-full"
                    >
                      {status}
                    </Badge>
                  </div>

                  {item.canonicalBookTitle && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      Maps to:{' '}
                      {item.canonicalBookId ? (
                        <Link href={`/book/${item.canonicalBookId}`} className="text-primary hover:underline font-medium">
                          {item.canonicalBookTitle}
                        </Link>
                      ) : (
                        <span>{item.canonicalBookTitle}</span>
                      )}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span>Source: {getSource(item)}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3 text-primary" /> {yesVotes}</span>
                    <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-destructive" /> {noVotes}</span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isVoting || wasReviewed}
                    onClick={() => handleVote(item.id, true)}
                    className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Check className="w-4 h-4" /> Same
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isVoting || wasReviewed}
                    onClick={() => handleVote(item.id, false)}
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" /> Different
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center p-12 border border-dashed rounded-xl bg-card">
            <p className="text-muted-foreground">No aliases match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
