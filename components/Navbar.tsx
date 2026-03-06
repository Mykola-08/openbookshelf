'use client'

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Cloud, User, Library, Layers as ListHeart, Compass, 
  CheckCircle2, Settings2, Tags, Search, ChevronDown,
  Puzzle, BookOpen, Users, SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { useModules } from "@/lib/hooks/use-modules";
import { useUserSettings } from "@/lib/hooks/use-user-settings";
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
import { AdvancedSearchDialog } from "@/components/AdvancedSearchDialog";

function NavLink({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">{label}</span>
      {active && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground rounded-full" />
      )}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { flags } = useFeatureFlags();
  const { moduleState } = useModules();
  const { settings } = useUserSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  // Don't show on reader pages  
  if (pathname.startsWith('/read/')) return null;

  return (
    <>
      {/* Desktop Header — single-row, refined */}
      <header className="sticky top-0 left-0 right-0 bg-background/80 supports-[backdrop-filter]:backdrop-blur-xl border-b border-border/50 z-[var(--z-nav)] hidden md:block">
        <div className="flex items-center h-14 px-6 lg:px-8 w-full max-w-7xl mx-auto gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4 text-background" />
            </div>
            <span className="text-base font-semibold text-foreground tracking-tight hidden xl:inline">
              OpenBookshelf
            </span>
          </Link>

          {/* Primary Navigation */}
          <nav className="flex items-center gap-0.5">
            {flags.enableLocalReader && (
              <NavLink
                href="/"
                icon={Library}
                label="Library"
                active={pathname === '/' || pathname.startsWith('/book/')}
              />
            )}
            {settings.enableCommunity && (
              <NavLink
                href="/community"
                icon={Users}
                label="Community"
                active={pathname.startsWith('/community')}
              />
            )}
            {flags.enableProgressTracker && (
              <NavLink
                href="/tracker"
                icon={CheckCircle2}
                label="Progress"
                active={pathname.startsWith('/tracker')}
              />
            )}
            {flags.enableOpdsDiscover && (
              <NavLink
                href="/discover"
                icon={Compass}
                label="Discover"
                active={pathname.startsWith('/discover')}
              />
            )}
            {flags.enableLocalReader && settings.enableCatalogDropdown && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap outline-none",
                      (pathname.startsWith('/authors') || pathname.startsWith('/series'))
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <ListHeart className="w-4 h-4" />
                    <span className="hidden lg:inline">Catalog</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                    {(pathname.startsWith('/authors') || pathname.startsWith('/series')) && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-foreground rounded-full" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem asChild>
                    <Link href="/authors" className="w-full cursor-pointer gap-2">
                      <User className="h-4 w-4" /> Authors
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/series" className="w-full cursor-pointer gap-2">
                      <ListHeart className="h-4 w-4" /> Series
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <form
            onSubmit={handleSearch}
            role="search"
            aria-label="Global search"
            className={cn(
              "relative transition-all duration-200",
              searchFocused ? "w-72" : "w-56"
            )}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search… ⌘K" 
              className="w-full pl-9 pr-10 h-9 rounded-full bg-muted/50 border-transparent text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background focus-visible:border-border focus-visible:shadow-sm" 
            />
            {settings.enableAdvancedSearch && (
              <button
                type="button"
                onClick={() => setAdvancedSearchOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Advanced search"
                title="Advanced search"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  aria-label="Open user menu" 
                  className="w-9 h-9 rounded-full bg-muted/70 flex items-center justify-center hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {settings.enableConnections && (
                  <DropdownMenuItem asChild>
                    <Link href="/connections" className="w-full cursor-pointer gap-2">
                      <Cloud className="h-4 w-4" /> Connections
                    </Link>
                  </DropdownMenuItem>
                )}
                {settings.enableAliases && moduleState.enabled.alias_resolution && moduleState.enabled.community_alias_review && (
                  <DropdownMenuItem asChild>
                    <Link href="/aliases" className="w-full cursor-pointer gap-2">
                      <Tags className="h-4 w-4" /> Aliases
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/modules" className="w-full cursor-pointer gap-2">
                    <Puzzle className="h-4 w-4" /> Modules
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="w-full cursor-pointer gap-2">
                    <Settings2 className="h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 left-0 right-0 bg-background/80 supports-[backdrop-filter]:backdrop-blur-xl border-b border-border/50 z-[var(--z-nav)] md:hidden">
        <div className="flex items-center h-12 px-4 gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold text-foreground">OpenBookshelf</span>
          </Link>

          <div className="flex-1" />

          <form onSubmit={handleSearch} role="search" aria-label="Mobile search" className="flex-1 max-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…" 
                className="w-full pl-8 pr-2 h-8 rounded-full bg-muted/50 border-transparent text-xs" 
              />
            </div>
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                aria-label="Open user menu" 
                className="w-8 h-8 rounded-full bg-muted/70 flex items-center justify-center"
              >
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {settings.enableConnections && <DropdownMenuItem asChild><Link href="/connections" className="w-full gap-2"><Cloud className="h-4 w-4" /> Connections</Link></DropdownMenuItem>}
              <DropdownMenuItem asChild><Link href="/modules" className="w-full gap-2"><Puzzle className="h-4 w-4" /> Modules</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/settings" className="w-full gap-2"><Settings2 className="h-4 w-4" /> Settings</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/90 supports-[backdrop-filter]:backdrop-blur-xl border-t border-border/50 z-[var(--z-nav)] md:hidden pb-safe">
        <div className="flex items-center justify-around h-14 px-2">
          {flags.enableLocalReader && (
            <Link
              href="/"
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px]",
                (pathname === '/' || pathname.startsWith('/book/'))
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Library className="w-5 h-5" />
              <span className="text-[10px] font-medium">Library</span>
            </Link>
          )}
          {settings.enableCommunity && (
            <Link
              href="/community"
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px]",
                pathname.startsWith('/community') ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-medium">Community</span>
            </Link>
          )}
          {flags.enableProgressTracker && (
            <Link
              href="/tracker"
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px]",
                pathname.startsWith('/tracker') ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-[10px] font-medium">Progress</span>
            </Link>
          )}
          {flags.enableOpdsDiscover && (
            <Link
              href="/discover"
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px]",
                pathname.startsWith('/discover') ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Compass className="w-5 h-5" />
              <span className="text-[10px] font-medium">Discover</span>
            </Link>
          )}
          {flags.enableLocalReader && settings.enableCatalogDropdown && (
            <Link
              href="/authors"
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px]",
                (pathname.startsWith('/authors') || pathname.startsWith('/series'))
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <ListHeart className="w-5 h-5" />
              <span className="text-[10px] font-medium">Catalog</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Advanced Search Dialog */}
      {settings.enableAdvancedSearch && (
        <AdvancedSearchDialog
          open={advancedSearchOpen}
          onOpenChange={setAdvancedSearchOpen}
          initialQuery={searchQuery}
        />
      )}
    </>
  );
}
