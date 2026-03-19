"use client";

import { useState, useEffect, useRef } from "react";
import { EpubReader } from "@/components/Reader";
import { ArrowLeft, Settings2, Moon, Sun, Coffee, Type, Minus, Plus, BookOpen, Bookmark } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookmarksPanel } from "@/components/BookmarksPanel";
import { createClient } from "@/utils/supabase/client";
import { resolveReadingStatus } from "@/lib/sync/reading-status";
import { useDebouncedCallback } from "use-debounce";

const FONT_FAMILIES = [
  { value: 'default', label: 'Default' },
  { value: 'serif', label: 'Serif (Georgia)' },
  { value: 'sans', label: 'Sans-serif' },
  { value: 'mono', label: 'Monospace' },
  { value: 'dyslexic', label: 'OpenDyslexic' },
];

const READER_PREFS_KEY = 'openbookshelf-reader-prefs';

function loadReaderPrefs() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(READER_PREFS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function saveReaderPrefs(prefs: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(READER_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

interface ReaderWrapperProps {
  url: string;
  bookId: string;
  title?: string;
  initialLocation?: string;
}

export function ReaderWrapper({ url, bookId, title, initialLocation }: ReaderWrapperProps) {
  const saved = loadReaderPrefs();
  const [location, setLocation] = useState<string | number | null>(initialLocation || null);
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">(saved?.theme || "light");
  const [fontSize, setFontSize] = useState([saved?.fontSize || 100]);
  const [fontFamily, setFontFamily] = useState(saved?.fontFamily || 'default');
  const [lineHeight, setLineHeight] = useState([saved?.lineHeight || 1.6]);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0, chapterLabel: '' });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.style.setProperty("--reader-bg", "var(--reader-dark-bg)");
      root.style.setProperty("--reader-fg", "var(--reader-dark-fg)");
      root.style.setProperty("--reader-border", "var(--reader-dark-border)");
      root.style.setProperty("--reader-accent", "#1e1e1e");
      root.style.setProperty("--reader-accent-fg", "#e5e7eb");
    } else if (theme === "sepia") {
      root.style.setProperty("--reader-bg", "var(--reader-sepia-bg)");
      root.style.setProperty("--reader-fg", "var(--reader-sepia-fg)");
      root.style.setProperty("--reader-border", "var(--reader-sepia-border)");
      root.style.setProperty("--reader-accent", "#e0d4be");
      root.style.setProperty("--reader-accent-fg", "#3a2d1e");
    } else {
      root.style.setProperty("--reader-bg", "var(--reader-light-bg)");
      root.style.setProperty("--reader-fg", "var(--reader-light-fg)");
      root.style.setProperty("--reader-border", "var(--reader-light-border)");
      root.style.setProperty("--reader-accent", "#f1f5f9");
      root.style.setProperty("--reader-accent-fg", "#0f172a");
    }
  }, [theme]);
  
  const supabase = createClient();
  
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Persist reader preferences
  useEffect(() => {
    saveReaderPrefs({ theme, fontSize: fontSize[0], fontFamily, lineHeight: lineHeight[0] });
  }, [theme, fontSize, fontFamily, lineHeight]);

  const saveReadingState = useDebouncedCallback(async (nextLocation: string | number | null, nextProgressPercent: number) => {
    if (!mounted.current) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from("user_books")
        .select("id, status, started_at, finished_at")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();

      const resolved = resolveReadingStatus({
        currentStatus: existing?.status,
        progressPercent: nextProgressPercent,
        startedAt: existing?.started_at,
        finishedAt: existing?.finished_at,
      });

      await supabase
        .from("user_books")
        .upsert(
          {
            user_id: user.id,
            book_id: bookId,
            status: resolved.nextStatus,
            progress: Math.round(nextProgressPercent),
            progress_unit: "percent",
            started_at: resolved.startedAt,
            finished_at: resolved.finishedAt,
            reading_location: nextLocation ? String(nextLocation) : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,book_id" }
        );
    } catch (err) {
      console.error("Failed to save reading state:", err);
    }
  }, 1500);

  const handleLocationChange = (newLocation: string | number) => {
    setLocation(newLocation);
    saveReadingState(newLocation, progress.percentage);
  };

  useEffect(() => {
    if (!location && progress.percentage <= 0) return;
    saveReadingState(location, progress.percentage);
  }, [location, progress.percentage, saveReadingState]);

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    if (theme === 'sepia') return <Coffee className="w-4 h-4" />;
    return <Sun className="w-4 h-4" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative" style={{ backgroundColor: 'var(--reader-bg)', color: 'var(--reader-fg)' }}>
      
      {/* Top Navbar overlay - semi transparent or solid depending on theme */}
      <div className={`h-14 flex items-center px-4 justify-between shrink-0 z-10 transition-colors shadow-sm
          bg-reader-bg border-reader-border text-reader-fg border-b`}
      >
         <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className={`rounded-full hover:bg-reader-accent hover:text-reader-accent-fg`}>
               <Link href={`/book/${bookId}`}>
                 <ArrowLeft className="w-5 h-5" />
               </Link>
            </Button>
            <span className="font-semibold text-sm truncate max-w-[200px] md:max-w-md hidden sm:inline-block">
               {title || "Reading"}
            </span>
         </div>

         <div className="flex items-center gap-2">
            {/* Bookmarks Popover */}
            <Popover>
               <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className={`gap-2 hover:bg-reader-accent hover:text-reader-accent-fg`}>
                     <Bookmark className="w-4 h-4" />
                     <span className="hidden sm:inline-block">Bookmarks</span>
                  </Button>
               </PopoverTrigger>
               <PopoverContent className="w-72" align="end" style={{ backgroundColor: 'var(--reader-bg)', color: 'var(--reader-fg)', borderColor: 'var(--reader-border)' }}>
                  <BookmarksPanel
                    bookId={bookId}
                    currentCfi={typeof location === 'string' ? location : null}
                    currentLabel={progress.chapterLabel || `Page ${progress.current}`}
                    currentPercentage={progress.percentage}
                    onNavigate={(cfi) => setLocation(cfi)}
                    theme={theme}
                  />
               </PopoverContent>
            </Popover>

            <Popover>
               <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className={`gap-2 hover:bg-reader-accent hover:text-reader-accent-fg`}>
                     <Settings2 className="w-4 h-4" />
                     <span className="hidden sm:inline-block">Appearance</span>
                  </Button>
               </PopoverTrigger>
               <PopoverContent className="w-80" align="end" style={{ backgroundColor: 'var(--reader-bg)', color: 'var(--reader-fg)', borderColor: 'var(--reader-border)' }}>
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <h4 className="font-medium text-sm leading-none">Theme</h4>
                        <div className="grid grid-cols-3 gap-2">
                           <Button 
                             variant={theme === 'light' ? 'default' : 'outline'} 
                             size="sm" 
                             className="w-full gap-2"
                             onClick={() => setTheme('light')}
                           >
                              <Sun className="w-4 h-4" /> Light
                           </Button>
                           <Button 
                             variant={theme === 'sepia' ? 'default' : 'outline'} 
                             size="sm" 
                             className="w-full gap-2 bg-[#f4ecd8] text-[#5b4636] hover:bg-[#eaddc5] hover:text-[#5b4636] border-[#d4c5ab]"
                             onClick={() => setTheme('sepia')}
                           >
                              <Coffee className="w-4 h-4" /> Sepia
                           </Button>
                           <Button 
                             variant={theme === 'dark' ? 'default' : 'outline'} 
                             size="sm" 
                             className="w-full gap-2 bg-background text-foreground hover:bg-muted border-border"
                             onClick={() => setTheme('dark')}
                           >
                              <Moon className="w-4 h-4" /> Dark
                           </Button>
                        </div>
                     </div>
                     
                     <Separator />

                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <Label className="text-sm">Font Size</Label>
                           <span className="text-xs text-muted-foreground font-mono">{fontSize[0]}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setFontSize([Math.max(50, fontSize[0] - 10)])}>
                              <Minus className="w-3 h-3" />
                           </Button>
                           <Slider 
                             value={fontSize} 
                             onValueChange={setFontSize} 
                             min={50} 
                             max={200} 
                             step={10} 
                             className="flex-1"
                           />
                           <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setFontSize([Math.min(200, fontSize[0] + 10)])}>
                              <Plus className="w-3 h-3" />
                           </Button>
                        </div>
                     </div>

                     <Separator />

                     <div className="space-y-2">
                        <Label className="text-sm">Font Family</Label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONT_FAMILIES.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <Label className="text-sm">Line Height</Label>
                           <span className="text-xs text-muted-foreground font-mono">{lineHeight[0].toFixed(1)}</span>
                        </div>
                        <Slider
                          value={lineHeight}
                          onValueChange={setLineHeight}
                          min={1.0}
                          max={2.5}
                          step={0.1}
                          className="flex-1"
                        />
                     </div>

                  </div>
               </PopoverContent>
            </Popover>
         </div>
      </div>

      {/* Reader Container */}
      <div className={`flex-1 relative bg-reader-bg`}>
         <EpubReader 
            url={url} 
            title={title}
            location={location}
            locationChanged={handleLocationChange}
            theme={theme}
            fontSize={fontSize[0]}
            fontFamily={fontFamily}
            lineHeight={lineHeight[0]}
            onProgressUpdate={setProgress}
         />
      </div>

      {/* Progress HUD */}
      {progress.percentage > 0 && (
        <div className={`h-8 flex items-center justify-between px-4 text-xs shrink-0 transition-colors border-t
          ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#333] text-gray-400' : 
            theme === 'sepia' ? 'bg-[#eaddc5] border-[#d4c5ab] text-[#7a6652]' : 
            'bg-gray-50 border-gray-200 text-gray-500'}`}
        >
          <span className="truncate max-w-[40%]">
            {progress.chapterLabel || 'Reading'}
          </span>
          <div className="flex items-center gap-3">
            <span>
              Page {progress.current}/{progress.total}
            </span>
            <div className="w-24 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress.percentage}%` }} />
            </div>
            <span className="font-mono tabular-nums">{progress.percentage}%</span>
          </div>
        </div>
      )}

    </div>
  );
}
