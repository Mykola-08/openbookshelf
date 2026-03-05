'use client'

import { useState } from 'react';
import { importBookAction } from '@/app/actions/import-book';
import { Download, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface RemoteBookItemProps {
  entry: any; // OPDS Entry
  sourceId: string;
}

export function RemoteBookItem({ entry, sourceId }: RemoteBookItemProps) {
  const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Extract cover
  const coverUrl = entry.links?.find((l: any) => l.rel?.includes('image') || l.type?.startsWith('image/'))?.href || 
                   entry.links?.find((l: any) => l.href?.endsWith('.jpg') || l.href?.endsWith('.png'))?.href;

  const handleImport = async () => {
    setStatus('importing');
    try {
      const result = await importBookAction(entry, sourceId);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(result.error);
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Unknown error');
    }
  };

  return (
    <div className="flex bg-white border border-gray-200 rounded-lg p-4 gap-4 hover:shadow-md transition-shadow">
      {/* Cover Image */}
      <div className="relative w-20 h-28 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={entry.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="text-xs">No Cover</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 truncate" title={entry.title}>{entry.title}</h3>
          <p className="text-sm text-gray-500 truncate mb-1">
             {entry.authors?.map((a: any) => a.name).join(', ') || 'Unknown Author'}
          </p>
          {entry.published_year && (
            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {entry.published_year}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
           <div className="text-xs text-gray-400 truncate max-w-[200px]">
             {entry.id}
           </div>
           
           <button 
             onClick={handleImport}
             disabled={status === 'importing' || status === 'success'}
             className={`
               flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
               ${status === 'idle' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : ''}
               ${status === 'importing' ? 'bg-gray-100 text-gray-500 cursor-wait' : ''}
               ${status === 'success' ? 'bg-green-50 text-green-700 cursor-default' : ''}
               ${status === 'error' ? 'bg-red-50 text-red-700 hover:bg-red-100' : ''}
             `}
           >
             {status === 'idle' && <><Download className="w-4 h-4" /> Import</>}
             {status === 'importing' && "Importing..."}
             {status === 'success' && <><Check className="w-4 h-4" /> Added</>}
             {status === 'error' && <><AlertCircle className="w-4 h-4" /> Retry</>}
           </button>
        </div>
        {status === 'error' && errorMsg && (
          <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
