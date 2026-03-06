"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ReactReader, ReactReaderStyle } from "react-reader";

interface EpubReaderProps {
  url: string;
  location?: string | number | null;
  locationChanged?: (loc: string | number) => void;
  title?: string;
  theme?: "light" | "dark" | "sepia";
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  onProgressUpdate?: (progress: { current: number; total: number; percentage: number; chapterLabel: string }) => void;
}

const FONT_FAMILY_MAP: Record<string, string> = {
  default: 'inherit',
  serif: 'Georgia, "Times New Roman", serif',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"Courier New", Courier, monospace',
  dyslexic: 'OpenDyslexic, sans-serif',
};

const themeStyles: Record<string, Record<string, any>> = {
  light: { body: { color: '#1a1a1a !important', background: '#ffffff !important' }, 'a': { color: '#2563eb !important' } },
  dark: { body: { color: '#d4d4d4 !important', background: '#121212 !important' }, 'a': { color: '#60a5fa !important' } },
  sepia: { body: { color: '#5b4636 !important', background: '#f4ecd8 !important' }, 'a': { color: '#92400e !important' } },
};

export function EpubReader({ url, location, locationChanged, title, theme = 'light', fontSize = 100, fontFamily = 'default', lineHeight = 1.6, onProgressUpdate }: EpubReaderProps) {
  const renditionRef = useRef<any>(null);
  const tocRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme + font size + font family + line height whenever they change
  useEffect(() => {
    const r = renditionRef.current;
    if (!r) return;
    r.themes.fontSize(`${fontSize}%`);
    const ts = themeStyles[theme] || themeStyles.light;
    const ff = FONT_FAMILY_MAP[fontFamily] || 'inherit';
    const customTheme = {
      ...ts,
      body: {
        ...ts.body,
        'font-family': `${ff} !important`,
        'line-height': `${lineHeight} !important`,
      },
    };
    r.themes.register('custom', customTheme);
    r.themes.select('custom');
  }, [theme, fontSize, fontFamily, lineHeight]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const r = renditionRef.current;
      if (!r) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'j' || e.key === 'J') {
        r.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
        r.prev();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getReaderStyles = useCallback((): typeof ReactReaderStyle => {
    const bg = theme === 'dark' ? '#121212' : theme === 'sepia' ? '#f4ecd8' : '#ffffff';
    const fg = theme === 'dark' ? '#d4d4d4' : theme === 'sepia' ? '#5b4636' : '#1a1a1a';
    return {
      ...ReactReaderStyle,
      readerArea: { ...ReactReaderStyle.readerArea, backgroundColor: bg, transition: undefined },
      arrow: { ...ReactReaderStyle.arrow, color: fg },
      tocArea: { ...ReactReaderStyle.tocArea, background: bg, color: fg },
      tocButtonExpanded: { ...ReactReaderStyle.tocButtonExpanded, background: theme === 'dark' ? '#333' : '#f3f3f3' },
      tocButton: { ...ReactReaderStyle.tocButton, color: fg },
    };
  }, [theme]);

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      {isLoading && (
        <div className="absolute inset-0 z-[var(--z-dialog)] flex flex-col items-center justify-center bg-background">
          <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: '60%' }} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Loading book...</p>
        </div>
      )}
      <ReactReader
        url={url}
        title={title || "Book Reader"}
        location={location ?? null}
        locationChanged={(epubcifi: string) => {
          if (locationChanged) locationChanged(epubcifi);
        }}
        tocChanged={(toc) => {
          tocRef.current = toc;
        }}
        getRendition={(rendition) => {
          renditionRef.current = rendition;
          rendition.themes.fontSize(`${fontSize}%`);
          const ts = themeStyles[theme] || themeStyles.light;
          const ff = FONT_FAMILY_MAP[fontFamily] || 'inherit';
          const customTheme = {
            ...ts,
            body: {
              ...ts.body,
              'font-family': `${ff} !important`,
              'line-height': `${lineHeight} !important`,
            },
          };
          rendition.themes.register('custom', customTheme);
          rendition.themes.select('custom');

          rendition.on('displayed', () => {
            setIsLoading(false);
          });

          rendition.on('relocated', (loc: any) => {
            if (onProgressUpdate && loc?.start) {
              const totalPages = loc.start?.displayed?.total || 1;
              const currentPage = loc.start?.displayed?.page || 0;
              const percentage = loc.start?.percentage ? Math.round(loc.start.percentage * 100) : 0;
              
              let chapterLabel = '';
              const cfi = loc.start?.cfi;
              if (cfi && tocRef.current.length > 0) {
                // Find closest matching TOC entry
                const toc = tocRef.current;
                for (let i = toc.length - 1; i >= 0; i--) {
                  if (toc[i].href) {
                    chapterLabel = toc[i].label?.trim() || '';
                    break;
                  }
                }
              }

              onProgressUpdate({
                current: currentPage,
                total: totalPages,
                percentage,
                chapterLabel,
              });
            }
          });

          // Tap zone navigation for mobile
          rendition.on('click', (e: MouseEvent) => {
            const w = window.innerWidth;
            if (e.clientX < w * 0.3) {
              rendition.prev();
            } else if (e.clientX > w * 0.7) {
              rendition.next();
            }
          });
        }}
        epubOptions={{
          flow: "paginated",
          manager: "default"
        }}
        readerStyles={getReaderStyles()}
      />
    </div>
  );
}

