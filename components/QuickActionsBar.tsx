"use client";

import { Button } from "@/components/ui/button";
import { BookOpen, Star, Tags, StickyNote, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickActionsBarProps {
  bookId: string;
  hasFile: boolean;
  status: string;
  progress: number;
  readingLocation: string | null;
}

export function QuickActionsBar({ bookId, hasFile, status, progress, readingLocation }: QuickActionsBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur border-t border-border z-40 md:hidden pb-safe flex justify-between gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {hasFile ? (
        <Button className="flex-1 rounded-full shadow-sm" size="sm" asChild>
          <Link href={`/read/${bookId}`}>
            <BookOpen className="w-4 h-4 mr-1.5" />
            {readingLocation ? "Continue" : progress > 0 ? "Continue" : "Read"}
          </Link>
        </Button>
      ) : (
        <Button className="flex-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm" size="sm">
          <Activity className="w-4 h-4 mr-1.5" />
          Update Progress
        </Button>
      )}

      <Button variant="secondary" size="icon" className="rounded-full shrink-0 shadow-sm" title="Rate title">
        <Star className="w-4 h-4" />
      </Button>
      <Button variant="secondary" size="icon" className="rounded-full shrink-0 shadow-sm" title="Add tags">
        <Tags className="w-4 h-4" />
      </Button>
      <Button variant="secondary" size="icon" className="rounded-full shrink-0 shadow-sm" title="Add note">
        <StickyNote className="w-4 h-4" />
      </Button>
    </div>
  );
}
