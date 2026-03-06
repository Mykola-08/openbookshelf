'use client';

import * as React from 'react';
import {
  BookOpen,
  ChevronRight,
  Globe,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { FeedSection, RecommendedBook } from '@/lib/search/recommender';

interface DiscoverFeedProps {
  initialSections: FeedSection[];
}

function BookCover({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <BookOpen className="w-8 h-8 text-muted-foreground/20" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover transition-transform group-hover:scale-105"
      loading="lazy"
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        const fallback = target.nextElementSibling;
        if (fallback) (fallback as HTMLElement).style.display = 'flex';
      }}
    />
  );
}

function FeedBookCard({ book }: { book: RecommendedBook }) {
  return (
    <div className="group shrink-0 w-35 sm:w-40">
      <div className="aspect-2/3 rounded-xl overflow-hidden bg-muted mb-2 shadow-sm group-hover:shadow-md transition-all relative">
        <BookCover src={book.coverUrl} alt={book.title} />
        {/* Fallback */}
        <div className="absolute inset-0 items-center justify-center bg-muted hidden">
          <BookOpen className="w-8 h-8 text-muted-foreground/20" />
        </div>
        {book.rating && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
            <span className="text-[10px] font-semibold">{book.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <h4 className="text-sm font-medium line-clamp-2 leading-snug text-foreground mb-0.5" title={book.title}>
        {book.title}
      </h4>
      <p className="text-xs text-muted-foreground truncate mb-1">
        {book.authors.join(', ') || 'Unknown'}
      </p>
      {book.publishedYear && (
        <span className="text-[10px] text-muted-foreground/60">{book.publishedYear}</span>
      )}
    </div>
  );
}

function FeedSectionRow({ section }: { section: FeedSection }) {
  const iconMap: Record<string, React.ReactNode> = {
    trending: <TrendingUp className="w-4 h-4 text-orange-500" />,
    genre: <Sparkles className="w-4 h-4 text-blue-500" />,
    author: <BookOpen className="w-4 h-4 text-purple-500" />,
    diverse: <Globe className="w-4 h-4 text-pink-500" />,
  };

  const sectionType = section.books[0]?.reasonType || 'trending';

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {iconMap[sectionType] || <Sparkles className="w-4 h-4" />}
          <div>
            <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
            {section.subtitle && (
              <p className="text-xs text-muted-foreground">{section.subtitle}</p>
            )}
          </div>
        </div>
        {section.books.length > 6 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 rounded-lg">
            See all <ChevronRight className="w-3 h-3" />
          </Button>
        )}
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-3 px-1">
          {section.books.map((book) => (
            <FeedBookCard key={book.id} book={book} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-48 h-5 rounded" />
          </div>
          <div className="flex gap-3 overflow-hidden px-1">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="shrink-0 w-35 sm:w-40">
                <Skeleton className="aspect-2/3 rounded-xl mb-2" />
                <Skeleton className="w-full h-4 rounded mb-1" />
                <Skeleton className="w-2/3 h-3 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscoverFeed({ initialSections }: DiscoverFeedProps) {
  const [sections] = React.useState<FeedSection[]>(initialSections);

  if (sections.length === 0) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">No recommendations yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Add some books to your library and we&apos;ll start building personalized recommendations for you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <FeedSectionRow key={section.id} section={section} />
      ))}
    </div>
  );
}

export { FeedSkeleton };
