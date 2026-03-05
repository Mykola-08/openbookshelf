'use client';
import { useState } from 'react';
import { importBookAction } from '@/app/actions/import-book';
import { Plus, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImportBookButton({ entry, sourceId = 'public-discovery', className }: { entry: any, sourceId?: string, className?: string }) {
  const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');

  const handleImport = async () => {
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

  if (status === 'success') {
    return (
      <Button size="sm" variant="secondary" className={"w-full text-xs gap-1 bg-green-50 text-green-700 hover:bg-green-100 "} disabled>
        <Check className="w-3 h-3" /> Added
      </Button>
    );
  }

  if (status === 'error') {
    return (
       <Button size="sm" variant="destructive" onClick={handleImport} className={"w-full text-xs gap-1 "}>
        <AlertCircle className="w-3 h-3" /> Retry
      </Button>
    );
  }

  return (
    <Button 
      size="sm" 
      onClick={handleImport} 
      disabled={status === 'importing'}
      className={"w-full text-xs gap-1 "}
    >
      {status === 'importing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
      {status === 'importing' ? 'Adding...' : 'Add to Library'}
    </Button>
  );
}
