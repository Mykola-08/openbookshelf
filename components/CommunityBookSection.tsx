'use client';

import { useState } from 'react';
import { useUserSettings } from '@/lib/hooks/use-user-settings';
import { Star, MessageSquare, Heart, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function CommunityBookSection({ bookId, title }: { bookId: string, title?: string }) {
  const { settings } = useUserSettings();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (!settings.enableCommunity || !settings.enableReviews) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t border-border/50">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Community Reviews</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Write a review */}
          <div className="bg-muted/10 border border-border/40 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Review this book</p>
                <div className="flex items-center gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn("w-5 h-5 transition-colors", (hoverRating || rating) >= star ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {rating > 0 && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
                <textarea 
                  placeholder="What did you think?" 
                  className="w-full min-h-[100px] p-3 text-sm rounded-md bg-background border border-input focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <Button className="w-full sm:w-auto h-9">Post Review</Button>
              </div>
            )}
          </div>

          {/* Example review */}
          <div className="space-y-4 border-b border-border/50 pb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary">SC</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">Sarah Chen</p>
                  <p className="text-xs text-muted-foreground">August 12, 2025</p>
                </div>
              </div>
              <div className="flex">
                {[1,2,3,4,5].map(star => (
                   <Star key={star} className={cn("w-4 h-4", star <= 4 ? "fill-yellow-500 text-yellow-500" : "text-muted")} />
                ))}
              </div>
            </div>
            <p className="text-[15px] leading-relaxed text-foreground/90">
              An absolutely stunning narrative. I couldn't put it down. The pacing is phenomenal and the character arcs are extremely well drawn out. Only giving it 4 stars instead of 5 because the ending felt slightly rushed compared to the middle act.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                <Heart className="w-4 h-4" /> 24</button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                <MessageSquare className="w-4 h-4" /> 2</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="bg-muted/10 border border-border/40 p-5 rounded-xl text-center">
            <p className="text-4xl font-bold tracking-tight mb-1">4.2</p>
            <div className="flex justify-center gap-1 mb-2">
               {[1,2,3,4].map(star => <Star key={star} className="w-5 h-5 fill-yellow-500 text-yellow-500" />)}
               <Star className="w-5 h-5 fill-yellow-500/50 text-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground">Based on 124 reviews</p>
            
            <div className="mt-6 space-y-2">
              {[
                { star: 5, pct: 54 },
                { star: 4, pct: 28 },
                { star: 3, pct: 10 },
                { star: 2, pct: 5 },
                { star: 1, pct: 3 },
              ].map((row) => (
                <div key={row.star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-right text-muted-foreground">{row.star} stars</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: row.pct + '%' }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
