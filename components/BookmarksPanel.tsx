"use client";

import { useState, useCallback, useEffect } from "react";
import { Bookmark, BookmarkCheck, Highlighter, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ReaderBookmark {
  id: string;
  cfi: string;
  label: string;
  percentage: number;
  createdAt: string;
}

export interface ReaderHighlight {
  id: string;
  cfi: string;
  text: string;
  color: string;
  note?: string;
  createdAt: string;
}

interface BookmarksPanelProps {
  bookId: string;
  currentCfi: string | null;
  currentLabel: string;
  currentPercentage: number;
  onNavigate: (cfi: string) => void;
  theme: "light" | "dark" | "sepia";
}

const BOOKMARKS_KEY = (bookId: string) => `obs-bookmarks-${bookId}`;
const HIGHLIGHTS_KEY = (bookId: string) => `obs-highlights-${bookId}`;

function loadBookmarks(bookId: string): ReaderBookmark[] {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY(bookId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookId: string, bookmarks: ReaderBookmark[]) {
  try {
    localStorage.setItem(BOOKMARKS_KEY(bookId), JSON.stringify(bookmarks));
  } catch {}
}

function loadHighlights(bookId: string): ReaderHighlight[] {
  try {
    const stored = localStorage.getItem(HIGHLIGHTS_KEY(bookId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHighlights(bookId: string, highlights: ReaderHighlight[]) {
  try {
    localStorage.setItem(HIGHLIGHTS_KEY(bookId), JSON.stringify(highlights));
  } catch {}
}

export function BookmarksPanel({
  bookId,
  currentCfi,
  currentLabel,
  currentPercentage,
  onNavigate,
  theme,
}: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [highlights, setHighlights] = useState<ReaderHighlight[]>([]);
  const [activeTab, setActiveTab] = useState<"bookmarks" | "highlights">("bookmarks");

  useEffect(() => {
    setBookmarks(loadBookmarks(bookId));
    setHighlights(loadHighlights(bookId));
  }, [bookId]);

  const isCurrentBookmarked = currentCfi
    ? bookmarks.some((b) => b.cfi === currentCfi)
    : false;

  const toggleBookmark = useCallback(() => {
    if (!currentCfi) return;

    if (isCurrentBookmarked) {
      const updated = bookmarks.filter((b) => b.cfi !== currentCfi);
      setBookmarks(updated);
      saveBookmarks(bookId, updated);
      toast.success("Bookmark removed");
    } else {
      const newBookmark: ReaderBookmark = {
        id: crypto.randomUUID(),
        cfi: currentCfi,
        label: currentLabel || `Page at ${currentPercentage}%`,
        percentage: currentPercentage,
        createdAt: new Date().toISOString(),
      };
      const updated = [...bookmarks, newBookmark];
      setBookmarks(updated);
      saveBookmarks(bookId, updated);
      toast.success("Bookmark added");
    }
  }, [bookId, bookmarks, currentCfi, currentLabel, currentPercentage, isCurrentBookmarked]);

  const removeBookmark = useCallback(
    (id: string) => {
      const updated = bookmarks.filter((b) => b.id !== id);
      setBookmarks(updated);
      saveBookmarks(bookId, updated);
    },
    [bookId, bookmarks]
  );

  const removeHighlight = useCallback(
    (id: string) => {
      const updated = highlights.filter((h) => h.id !== id);
      setHighlights(updated);
      saveHighlights(bookId, updated);
    },
    [bookId, highlights]
  );

  const themeClasses = "bg-reader-bg text-reader-fg border-reader-border";

  const tabActiveClasses = "bg-reader-accent text-reader-accent-fg";

  return (
    <div className="space-y-3">
      {/* Quick bookmark toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleBookmark}
        className={`gap-2 w-full justify-start hover:bg-reader-accent hover:text-reader-accent-fg`}
      >
        {isCurrentBookmarked ? (
          <BookmarkCheck className="w-4 h-4 text-primary" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        {isCurrentBookmarked ? "Remove Bookmark" : "Bookmark This Page"}
      </Button>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-lg bg-foreground/5">
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
            activeTab === "bookmarks" ? tabActiveClasses : "text-inherit opacity-60 hover:opacity-80"
          }`}
        >
          Bookmarks ({bookmarks.length})
        </button>
        <button
          onClick={() => setActiveTab("highlights")}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
            activeTab === "highlights" ? tabActiveClasses : "text-inherit opacity-60 hover:opacity-80"
          }`}
        >
          Highlights ({highlights.length})
        </button>
      </div>

      {/* List */}
      <div className="max-h-64 overflow-y-auto space-y-1.5">
        {activeTab === "bookmarks" ? (
          bookmarks.length === 0 ? (
            <p className="text-xs opacity-50 text-center py-4">
              No bookmarks yet. Bookmark pages to find them later.
            </p>
          ) : (
            bookmarks
              .sort((a, b) => a.percentage - b.percentage)
              .map((bm) => (
                <div
                  key={bm.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-black/5 group ${
                    bm.cfi === currentCfi ? "ring-1 ring-primary/30 bg-primary/5" : ""
                  }`}
                  onClick={() => onNavigate(bm.cfi)}
                >
                  <Bookmark className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{bm.label}</p>
                    <p className="text-[10px] opacity-50">{bm.percentage}%</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(bm.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove bookmark"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))
          )
        ) : highlights.length === 0 ? (
          <p className="text-xs opacity-50 text-center py-4">
            No highlights yet. Select text while reading to highlight it.
          </p>
        ) : (
          highlights
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((hl) => (
              <div
                key={hl.id}
                className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-foreground/5 group"
                onClick={() => onNavigate(hl.cfi)}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-1 h-full min-h-[20px] rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: hl.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed line-clamp-3">
                      &ldquo;{hl.text}&rdquo;
                    </p>
                    {hl.note && (
                      <p className="text-[10px] opacity-60 mt-1 italic">{hl.note}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHighlight(hl.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label="Remove highlight"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// Export helper to add highlights from text selection
export function addHighlight(
  bookId: string,
  cfi: string,
  text: string,
  color: string = "#fbbf24"
) {
  const highlights = loadHighlights(bookId);
  const newHighlight: ReaderHighlight = {
    id: crypto.randomUUID(),
    cfi,
    text,
    color,
    createdAt: new Date().toISOString(),
  };
  const updated = [...highlights, newHighlight];
  saveHighlights(bookId, updated);
  return updated;
}
