"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Download, AlertTriangle, Merge, Copy, Plus } from "lucide-react";

interface ImportEntry {
  title: string;
  author?: string;
  coverUrl?: string;
  format?: string;
  language?: string;
  sourceUrl?: string;
  sourceName?: string;
}

interface ImportPreviewModalProps {
  entry: ImportEntry;
  onImport: (strategy: "new" | "merge" | "skip") => Promise<void>;
  hasPotentialDuplicate?: boolean;
  duplicateTitle?: string;
  children: React.ReactNode;
}

export function ImportPreviewModal({
  entry,
  onImport,
  hasPotentialDuplicate = false,
  duplicateTitle,
  children,
}: ImportPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedStrategy, setSelectedStrategy] = useState<"new" | "merge" | "skip">(
    hasPotentialDuplicate ? "merge" : "new"
  );

  const handleImport = () => {
    startTransition(async () => {
      try {
        await onImport(selectedStrategy);
        toast.success(
          selectedStrategy === "skip"
            ? "Import skipped"
            : `"${entry.title}" imported successfully`
        );
        setOpen(false);
      } catch (err) {
        toast.error("Import failed. Please try again.");
      }
    });
  };

  const strategies = [
    {
      id: "new" as const,
      label: "Import as new",
      description: "Create a new book entry in your library",
      icon: Plus,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    ...(hasPotentialDuplicate
      ? [
          {
            id: "merge" as const,
            label: "Merge with existing",
            description: `Update "${duplicateTitle || "existing book"}" with new data`,
            icon: Merge,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            id: "skip" as const,
            label: "Skip import",
            description: "Don't import — a similar book already exists",
            icon: AlertTriangle,
            color: "text-muted-foreground",
            bg: "bg-muted",
          },
        ]
      : []),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
          <DialogDescription>
            Review this book before adding it to your library.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Book preview card */}
          <div className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-16 h-24 bg-muted rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              {entry.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.coverUrl}
                  alt={entry.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                {entry.title}
              </h3>
              {entry.author && (
                <p className="text-xs text-muted-foreground mt-1">{entry.author}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {entry.format && (
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {entry.format}
                  </Badge>
                )}
                {entry.language && (
                  <Badge variant="outline" className="text-[10px]">
                    {entry.language}
                  </Badge>
                )}
                {entry.sourceName && (
                  <Badge variant="outline" className="text-[10px]">
                    from {entry.sourceName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Duplicate warning */}
          {hasPotentialDuplicate && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  Possible duplicate detected
                </p>
                <p className="text-amber-700 dark:text-amber-400/80 text-xs mt-0.5">
                  A book with a similar title already exists in your library:
                  &ldquo;{duplicateTitle}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Import strategy selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Import strategy</p>
            {strategies.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStrategy(s.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedStrategy === s.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/50 hover:border-border hover:bg-muted/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isPending}>
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                Importing...
              </span>
            ) : selectedStrategy === "skip" ? (
              "Skip"
            ) : (
              <>
                <Download className="w-4 h-4 mr-1.5" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
