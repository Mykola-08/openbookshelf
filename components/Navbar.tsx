'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Cloud, User, Library, Layers as ListHeart, Compass, 
  CheckCircle2, Settings2, Tags, Search, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { useModules } from "@/lib/hooks/use-modules";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { flags } = useFeatureFlags();
  const { moduleState } = useModules();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // In a real app this would go to a search page
      // router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      console.log('Search:', searchQuery);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-md border-b border-border z-50 flex flex-col shadow-sm">
      
      {/* Top Row: Logo, Search, Profile */}
      <div className="flex items-center justify-between h-14 px-4 md:px-8 w-full gap-4 max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2 shrink-0">
          <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span className="hidden sm:inline-block">OpenBookshelf</span>
        </Link>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-auto px-2 md:px-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors, series..." 
              className="w-full pl-9 h-9 rounded-full bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-border" 
            />
          </form>
        </div>

        {/* Profile Dropdown */}
        <div className="flex items-center shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
                <User className="w-4 h-4 text-foreground cursor-pointer" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/connections" className="w-full cursor-pointer">
                  <Cloud className="mr-2 h-4 w-4" /> Connections
                </Link>
              </DropdownMenuItem>
              {moduleState.enabled.alias_resolution && moduleState.enabled.community_alias_review && (
                <DropdownMenuItem asChild>
                  <Link href="/aliases" className="w-full cursor-pointer">
                    <Tags className="mr-2 h-4 w-4" /> Aliases
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full cursor-pointer">
                  <Settings2 className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bottom Row: Navigation Links */}
      <nav className="flex items-center px-4 md:px-8 h-12 w-full max-w-7xl mx-auto overflow-x-auto gap-1 scrollbar-hide text-sm">
        {flags.enableLocalReader && (
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
              pathname === '/' ? "bg-accent/60 text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            <Library className="w-4 h-4" />
            Library
          </Link>
        )}
        
        {flags.enableProgressTracker && (
          <Link
            href="/tracker"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
              pathname === '/tracker' ? "bg-accent/60 text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Progress
          </Link>
        )}

        {flags.enableOpdsDiscover && (
          <Link
            href="/discover"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
              pathname.startsWith('/discover') ? "bg-accent/60 text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            <Compass className="w-4 h-4" />
            Discover
          </Link>
        )}

        {/* Catalog Dropdown (Author & Series) */}
        {flags.enableLocalReader && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap outline-none",
                  (pathname.startsWith('/authors') || pathname.startsWith('/series')) 
                  ? "bg-accent/60 text-accent-foreground font-semibold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                <ListHeart className="w-4 h-4" />
                Catalog
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/authors" className="w-full cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Authors
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/series" className="w-full cursor-pointer">
                  <ListHeart className="mr-2 h-4 w-4" /> Series
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
</header>
  );
}
