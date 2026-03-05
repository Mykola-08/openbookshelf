"use client";

import { useState, useEffect, useRef } from "react";
import { EpubReader } from "@/components/Reader";
import { ArrowLeft, Settings2, Moon, Sun, Coffee, Type, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createBrowserClient } from "@supabase/ssr";
import { useDebouncedCallback } from "use-debounce";

interface ReaderWrapperProps {
  url: string;
  bookId: string;
  title?: string;
  initialLocation?: string;
}

export function ReaderWrapper({ url, bookId, title, initialLocation }: ReaderWrapperProps) {
  const [location, setLocation] = useState<string | number | null>(initialLocation || null);
  const [theme, setTheme] = useState<"light" | "dark" | "sepia">("light");
  const [fontSize, setFontSize] = useState([100]); // percentage
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const saveLocation = useDebouncedCallback(async (newLocation: string | number) => {
    if (!mounted.current) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update the user's reading position
      await supabase
        .from("user_books")
        .update({ 
            reading_location: newLocation.toString(),
            updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("book_id", bookId);
        
    } catch (err) {
      console.error("Failed to save reading location:", err);
    }
  }, 2000);

  const handleLocationChange = (newLocation: string | number) => {
    setLocation(newLocation);
    saveLocation(newLocation);
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    if (theme === 'sepia') return <Coffee className="w-4 h-4" />;
    return <Sun className="w-4 h-4" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
      
      {/* Top Navbar overlay - semi transparent or solid depending on theme */}
      <div className={`h-14 flex items-center px-4 justify-between shrink-0 z-10 transition-colors shadow-sm
          ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#333] text-gray-200' : 
            theme === 'sepia' ? 'bg-[#eaddc5] border-[#d4c5ab] text-[#5b4636]' : 
            'bg-white border-gray-200 text-gray-900'} border-b`}
      >
         <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild className={`rounded-full ${theme === 'dark' ? 'hover:bg-[#333] hover:text-white' : ''}`}>
               <Link href={`/book/${bookId}`}>
                 <ArrowLeft className="w-5 h-5" />
               </Link>
            </Button>
            <span className="font-semibold text-sm truncate max-w-[200px] md:max-w-md hidden sm:inline-block">
               {title || "Reading"}
            </span>
         </div>

         <div className="flex items-center gap-2">
            <Popover>
               <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className={`gap-2 ${theme === 'dark' ? 'hover:bg-[#333] hover:text-white' : ''}`}>
                     <Settings2 className="w-4 h-4" />
                     <span className="hidden sm:inline-block">Appearance</span>
                  </Button>
               </PopoverTrigger>
               <PopoverContent className="w-80" align="end">
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
                             className="w-full gap-2 bg-[#121212] text-gray-200 hover:bg-[#333] hover:text-white border-[#333]"
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
                           <span className="text-xs text-gray-500 font-mono">{fontSize[0]}%</span>
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

                  </div>
               </PopoverContent>
            </Popover>
         </div>
      </div>

      {/* Reader Container */}
      <div className={`flex-1 relative ${theme === 'dark' ? 'bg-[#121212]' : theme === 'sepia' ? 'bg-[#f4ecd8]' : 'bg-white'}`}>
         <EpubReader 
            url={url} 
            title={title}
            location={location}
            locationChanged={handleLocationChange}
            theme={theme}
            fontSize={fontSize[0]}
         />
      </div>

    </div>
  );
}
