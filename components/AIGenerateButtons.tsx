"use client";

import { useTransition } from "react";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { generateBookDescription, generateChapterSummary } from "@/app/actions/ai-generate";

export function GenerateDescriptionButton({ bookId }: { bookId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => startTransition(() => { generateBookDescription(bookId); })}
      disabled={isPending}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {isPending ? "Generating..." : "AI Generate Description"}
    </Button>
  );
}

export function GenerateChapterSummaryButton({ bookId, chapterId, chapterTitle }: { bookId: string, chapterId: string, chapterTitle: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => startTransition(() => { generateChapterSummary(bookId, chapterTitle, chapterId); })}
      disabled={isPending}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {isPending ? "Generating..." : "AI Summarize Chapter"}
    </Button>
  );
}
