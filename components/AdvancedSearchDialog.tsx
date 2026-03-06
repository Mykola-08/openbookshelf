'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Library,
  Globe,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { SearchFilters } from '@/lib/search/search-engine';

const COMMON_GENRES = [
  'Science Fiction', 'Fantasy', 'Mystery', 'Thriller', 'Romance',
  'Horror', 'History', 'Biography', 'Science', 'Philosophy',
  'Psychology', 'Poetry', 'Self-Help', 'Adventure', 'Drama',
];

const LANGUAGES = [
  { value: '', label: 'Any language' },
  { value: 'eng', label: 'English' },
  { value: 'fre', label: 'French' },
  { value: 'ger', label: 'German' },
  { value: 'spa', label: 'Spanish' },
  { value: 'ita', label: 'Italian' },
  { value: 'por', label: 'Portuguese' },
  { value: 'rus', label: 'Russian' },
  { value: 'jpn', label: 'Japanese' },
  { value: 'chi', label: 'Chinese' },
];

interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

export function AdvancedSearchDialog({ open, onOpenChange, initialQuery = '' }: AdvancedSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [field, setField] = React.useState<SearchFilters['field']>('all');
  const [sortBy, setSortBy] = React.useState<SearchFilters['sortBy']>('relevance');
  const [searchLibrary, setSearchLibrary] = React.useState(true);
  const [searchCatalogs, setSearchCatalogs] = React.useState(true);
  const [searchOpenLibrary, setSearchOpenLibrary] = React.useState(true);
  const [yearFrom, setYearFrom] = React.useState('');
  const [yearTo, setYearTo] = React.useState('');
  const [language, setLanguage] = React.useState('');
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);
  const [minRating, setMinRating] = React.useState('');

  React.useEffect(() => {
    if (open && initialQuery) {
      setQuery(initialQuery);
    }
  }, [open, initialQuery]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleSearch = () => {
    if (!query.trim()) return;

    const params = new URLSearchParams();
    params.set('q', query);
    if (field !== 'all') params.set('field', field);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (!searchLibrary) params.set('lib', '0');
    if (!searchCatalogs) params.set('cat', '0');
    if (!searchOpenLibrary) params.set('ol', '0');
    if (yearFrom) params.set('from', yearFrom);
    if (yearTo) params.set('to', yearTo);
    if (language) params.set('lang', language);
    if (selectedGenres.length > 0) params.set('genres', selectedGenres.join(','));
    if (minRating) params.set('rating', minRating);

    router.push(`/search?${params.toString()}`);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const activeFilterCount = [
    field !== 'all',
    sortBy !== 'relevance',
    !searchLibrary,
    !searchCatalogs,
    !searchOpenLibrary,
    yearFrom,
    yearTo,
    language,
    selectedGenres.length > 0,
    minRating,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setField('all');
    setSortBy('relevance');
    setSearchLibrary(true);
    setSearchCatalogs(true);
    setSearchOpenLibrary(true);
    setYearFrom('');
    setYearTo('');
    setLanguage('');
    setSelectedGenres([]);
    setMinRating('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0">
        {/* Search header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <DialogHeader className="mb-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Advanced Search
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search books, authors, descriptions, ISBNs..."
              className="pl-10 pr-4 h-11 text-base rounded-xl bg-muted/50 border-transparent focus-visible:border-border"
              autoFocus
            />
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Search field */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search in</Label>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'title', 'author', 'description', 'isbn', 'genre'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setField(f)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                    field === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {f === 'all' ? 'All fields' : f}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Sources */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Search sources</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={cn(
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                searchLibrary ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-muted/20'
              )}>
                <Switch checked={searchLibrary} onCheckedChange={setSearchLibrary} />
                <div className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">My Library</span>
                </div>
              </label>
              <label className={cn(
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                searchCatalogs ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-muted/20'
              )}>
                <Switch checked={searchCatalogs} onCheckedChange={setSearchCatalogs} />
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">OPDS Catalogs</span>
                </div>
              </label>
              <label className={cn(
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                searchOpenLibrary ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-muted/20'
              )}>
                <Switch checked={searchOpenLibrary} onCheckedChange={setSearchOpenLibrary} />
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Open Library</span>
                </div>
              </label>
            </div>
          </div>

          <Separator />

          {/* Genres */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Genres {selectedGenres.length > 0 && <span className="text-primary">({selectedGenres.length})</span>}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                    selectedGenres.includes(genre)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground'
                  )}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Year range & Language & Rating */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Year from</Label>
              <Input
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                placeholder="e.g. 1950"
                className="h-9 text-sm rounded-lg"
                min={0}
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Year to</Label>
              <Input
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                placeholder="e.g. 2025"
                className="h-9 text-sm rounded-lg"
                min={0}
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-9 text-sm rounded-lg">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value || 'any'}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Min rating</Label>
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="h-9 text-sm rounded-lg">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="3.5">3.5+ stars</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="4.5">4.5+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Sort */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sort results by</Label>
            <div className="flex flex-wrap gap-1.5">
              {([
                { value: 'relevance', label: 'Relevance' },
                { value: 'popularity', label: 'Popularity' },
                { value: 'rating', label: 'Rating' },
                { value: 'year_desc', label: 'Newest first' },
                { value: 'year_asc', label: 'Oldest first' },
                { value: 'title_asc', label: 'Title A–Z' },
              ] as { value: SearchFilters['sortBy']; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    sortBy === value
                      ? 'bg-foreground text-background'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query.trim()}
            className="rounded-xl px-6 gap-2"
          >
            <Search className="w-4 h-4" />
            Search
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 rounded-full bg-primary-foreground/20 text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
