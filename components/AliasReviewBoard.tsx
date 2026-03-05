"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";

export interface AliasReviewItem {
  id: string;
  sourceText?: string;
  alias_title?: string;
  origin_source_name?: string | null;
}

export function AliasReviewBoard({ items }: { items: AliasReviewItem[] }) {
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  if (items.length === 0) return <p className="text-muted-foreground text-sm py-4">No pending alias reviews.</p>;

  return (
    <div className="space-y-3">
      {items.map(item => {
        if (reviewed.has(item.id)) return null;
        return (
          <div key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-card">
            <div>
              <p className="font-medium text-sm">{item.alias_title || item.sourceText}</p>
              <p className="text-xs text-muted-foreground">Source: {item.origin_source_name || "Unknown"}</p>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={() => setReviewed(new Set([...reviewed, item.id]))}>
                <Check className="w-4 h-4 text-green-500" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => setReviewed(new Set([...reviewed, item.id]))}>
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
