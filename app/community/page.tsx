'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserSettings } from '@/lib/hooks/use-user-settings';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Heart, Share2, Star, UserPlus, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

// MOCK DATA for community aspects
const FEED_EVENTS = [
  {
    id: 'e1',
    user: { name: 'Sarah Chen', handle: '@schen', avatar: 'SC' },
    type: 'review',
    book: { title: 'Project Hail Mary', author: 'Andy Weir', cover: 'https://covers.openlibrary.org/b/id/11494950-M.jpg' },
    rating: 5,
    content: 'Absolutely incredible! The science was so well researched and Rocky is my new favorite character in all of sci-fi.',
    likes: 12,
    comments: 3,
    time: '2 hours ago'
  },
  {
    id: 'e2',
    user: { name: 'Marcus Doe', handle: '@marcusd', avatar: 'MD' },
    type: 'finished',
    book: { title: 'The Three-Body Problem', author: 'Cixin Liu', cover: 'https://covers.openlibrary.org/b/id/12833075-M.jpg' },
    content: null,
    likes: 5,
    comments: 1,
    time: '5 hours ago'
  },
  {
    id: 'e3',
    user: { name: 'Alice Wong', handle: '@alice_reads', avatar: 'AW' },
    type: 'started',
    book: { title: 'Dune', author: 'Frank Herbert', cover: 'https://covers.openlibrary.org/b/id/12571731-M.jpg' },
    content: 'Finally diving into this classic before the next movie comes out!',
    likes: 8,
    comments: 0,
    time: 'Yesterday'
  }
];

const FRIENDS = [
  { id: 'f1', name: 'Sarah Chen', handle: '@schen', avatar: 'SC', currentlyReading: 'Leviathan Wakes' },
  { id: 'f2', name: 'Marcus Doe', handle: '@marcusd', avatar: 'MD', currentlyReading: 'The Dark Forest' },
  { id: 'f3', name: 'Alice Wong', handle: '@alice_reads', avatar: 'AW', currentlyReading: 'Dune' }
];

export default function CommunityPage() {
  const { settings } = useUserSettings();
  const { books } = useAppStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'goals'>('feed');

  if (!settings.enableCommunity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <GlobeIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Community Features Disabled</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          You have disabled community features in your settings. Enable them to share reviews, see friend activity, and track goals.
        </p>
        <Button asChild>
          <Link href="/settings">Go to Settings</Link>
        </Button>
      </div>
    );
  }

  // Calculate my goal progress (assuming goal is 50 for mock)
  const MY_GOAL = 50;
  const readCount = books.filter(b => b.status === 'finished').length;
  const goalProgress = Math.min((readCount / MY_GOAL) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center gap-6 border-b border-border/50 pb-4 mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Community</h1>
            
            <div className="flex items-center bg-muted/50 rounded-lg p-1 ml-auto">
              {settings.enableActivityFeed && (
                <button
                  onClick={() => setActiveTab('feed')}
                  className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === 'feed' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  Activity
                </button>
              )}
              {settings.enableGoals && (
                <button
                  onClick={() => setActiveTab('goals')}
                  className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === 'goals' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  Challenges
                </button>
              )}
            </div>
          </div>

          {activeTab === 'feed' && settings.enableActivityFeed && (
            <div className="space-y-6">
              {FEED_EVENTS.map(event => (
                <Card key={event.id} className="border-border/40 shadow-sm overflow-hidden">
                  <CardHeader className="py-4 px-5 bg-muted/20 flex flex-row items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {event.user.avatar}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">{event.user.name}</span>{' '}
                        <span className="text-muted-foreground">
                          {event.type === 'review' && 'reviewed a book'}
                          {event.type === 'finished' && 'finished reading'}
                          {event.type === 'started' && 'started reading'}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex gap-5">
                    {event.book.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.book.cover} alt={event.book.title} className="w-16 md:w-20 object-cover rounded shadow-sm shrink-0" />
                    ) : (
                      <div className="w-16 md:w-20 aspect-[2/3] bg-muted flex items-center justify-center rounded shadow-sm shrink-0 text-xs text-muted-foreground text-center p-1">No Cover</div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base line-clamp-1">{event.book.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">by {event.book.author}</p>
                      
                      {event.type === 'review' && event.rating && settings.enableReviews && (
                        <div className="flex gap-1 mb-2">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className={cn("w-4 h-4", star <= event.rating ? "fill-yellow-500 text-yellow-500" : "text-muted")} />
                          ))}
                        </div>
                      )}

                      {event.content && (
                        <p className="text-sm text-foreground/90 mt-2 bg-muted/30 p-3 rounded-md italic">
                          &quot;{event.content}&quot;
                        </p>
                      )}

                      <div className="flex gap-4 mt-4 pt-4 border-t border-border/50">
                        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors">
                          <Heart className="w-4 h-4" /> {event.likes}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                          <MessageSquare className="w-4 h-4" /> {event.comments}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'goals' && settings.enableGoals && (
            <div className="space-y-6">
              <Card className="border-primary/20 shadow-md overflow-hidden bg-primary/5">
                <CardHeader className="pb-3 border-b border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        2026 Reading Challenge
                      </CardTitle>
                      <CardDescription>Your personal reading goal for the year.</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{readCount} <span className="text-lg font-normal text-muted-foreground">/ {MY_GOAL}</span></p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Progress value={goalProgress} className="h-3 bg-primary/10" />
                  <p className="text-sm text-center text-muted-foreground mt-4">
                    {readCount >= MY_GOAL 
                      ? "Congratulations! You reached your goal!" 
                      : `You're ${MY_GOAL - readCount} books away from your goal. Keep it up!`}
                  </p>
                </CardContent>
              </Card>

              <h3 className="text-lg font-semibold mt-8 mb-4">Friends&apos; Progress</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { name: 'Sarah Chen', read: 42, goal: 50 },
                  { name: 'Marcus Doe', read: 12, goal: 24 },
                  { name: 'Alice Wong', read: 65, goal: 100 }
                ].map((friend, i) => (
                  <Card key={i} className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                        {friend.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-sm truncate">{friend.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{friend.read} / {friend.goal}</span>
                        </div>
                        <Progress value={(friend.read / friend.goal) * 100} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* Right Sidebar: Friends */}
        <aside className="w-full md:w-72 shrink-0 space-y-6">
          <Card className="border-border/40 shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center justify-between">
                Following
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {FRIENDS.map(friend => (
                <div key={friend.id} className="flex gap-3 items-center">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-semibold text-xs shrink-0">
                    {friend.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium leading-none truncate mb-1">{friend.name}</p>
                    <p className="text-[12px] text-muted-foreground truncate">reading: {friend.currentlyReading}</p>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full mt-2 text-xs h-8">View All Friends</Button>
            </CardContent>
          </Card>
        </aside>

      </div>
    </div>
  );
}

function GlobeIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}
