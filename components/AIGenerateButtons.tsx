"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { generateBookDescription, generateChapterSummary } from "@/app/actions/ai-generate";

export function GenerateDescriptionButton({ bookId }: { bookId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        startTransition(async () => {
          try {
            const text = await generateBookDescription(bookId);
            toast.success(text ? "Description generated" : "Generated, but response was empty");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to generate description");
          }
        })
      }
      disabled={isPending}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {isPending ? "Generating..." : "AI Generate Description"}
    </Button>
  );
}

export function GenerateChapterSummaryButton({
  bookId,
  chapterId,
  chapterTitle,
}: {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        startTransition(async () => {
          try {
            const text = await generateChapterSummary(bookId, chapterTitle, chapterId);
            toast.success(text ? "Chapter summary generated" : "Generated, but response was empty");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to summarize chapter");
          }
        })
      }
      disabled={isPending}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      {isPending ? "Generating..." : "AI Summarize Chapter"}
    </Button>
  );
}
