"use client";
import { toast } from 'sonner';

import { useState } from "react";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";
import { voteAliasAction } from "@/app/actions/alias-vote";

export interface AliasReviewItem {
  id: string;
  sourceText?: string;
  alias_title?: string;
  origin_source_name?: string | null;
}

export function AliasReviewBoard({ items }: { items: AliasReviewItem[] }) {
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());

  if (items.length === 0) return <p className="text-muted-foreground text-sm py-4">No pending alias reviews.</p>;

  const handleVote = async (id: string, isSame: boolean) => {
    try {
      setLoading(prev => new Set([...prev, id]));
      const result = await voteAliasAction(id,  isSame);
      if (result.success) {
        toast.success(isSame ? "Approved alias mapping" : "Rejected alias mapping");
      } else {
        toast.error("Failed to vote: " + result.error);
      }
      if (result.success) {
        setReviewed(prev => new Set([...prev, id]));
      } else {
        alert("Failed to cast vote: " + result.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-3">
      {items.map(item => {
        if (reviewed.has(item.id)) return null;
        const isVoting = loading.has(item.id);
        
        return (
          <div key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
            <div>
              <p className="font-medium text-sm">{item.alias_title || item.sourceText}</p>
              <p className="text-xs text-muted-foreground">Source: {item.origin_source_name || "Unknown"}</p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" disabled={isVoting} onClick={() => handleVote(item.id, true)}>
                <Check className="w-4 h-4 text-green-500" />
              </Button>
              <Button size="icon" variant="outline" disabled={isVoting} onClick={() => handleVote(item.id, false)}>
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
