'use client';
import { useState } from 'react';
import { importBookAction } from '@/app/actions/import-book';
import { Plus, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportPreviewModal } from '@/components/ImportPreviewModal';

export function ImportBookButton({ entry, sourceId = 'public-discovery', className }: { entry: any, sourceId?: string, className?: string }) {
  const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');

  const handleImport = async (strategy: "new" | "merge" | "skip") => {
    if (strategy === 'skip') return;
    setStatus('importing');
    try {
      const result = await importBookAction(entry, sourceId);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const previewEntry = {
    title: entry.title || 'Unknown Title',
    author: entry.authors?.map((a: any) => a.name).join(', ') || entry.author || undefined,
    coverUrl: entry.links?.find((l: any) => l.type?.startsWith('image/'))?.href || undefined,
    format: entry.links?.find((l: any) => l.type === 'application/epub+zip') ? 'EPUB' : undefined,
    language: entry.language || undefined,
    sourceName: 'OPDS Catalog',
  };

  if (status === 'success') {
    return (
      <Button size="sm" variant="secondary" className="w-full text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20" disabled>
        <Check className="w-3 h-3" /> Added
      </Button>
    );
  }

  if (status === 'error') {
    return (
       <Button size="sm" variant="destructive" onClick={() => handleImport('new')} className="w-full text-xs gap-1">
        <AlertCircle className="w-3 h-3" /> Retry
      </Button>
    );
  }

  return (
    <ImportPreviewModal entry={previewEntry} onImport={handleImport}>
      <Button 
        size="sm" 
        disabled={status === 'importing'}
        className="w-full text-xs gap-1"
      >
        {status === 'importing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        {status === 'importing' ? 'Adding...' : 'Add to Library'}
      </Button>
    </ImportPreviewModal>
  );
}
