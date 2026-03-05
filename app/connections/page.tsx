// Connections Page Update
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Plus, Settings, Globe, Lock, ArrowRightLeft, Cloud } from "@/components/ui/icons";

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: userSources } = await supabase.from('user_sources').select('*');

  // If no DB data, show "add new"
  const hasSources = userSources && userSources.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
       {/* Header */}
       <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4 md:px-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mr-12 tracking-tight flex items-center gap-2">
           <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
           OpenBookshelf
        </h1>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors py-5 border-b-2 border-transparent hover:border-gray-200">Library</Link>
            <Link href="/connections" className="text-blue-600 font-semibold border-b-2 border-blue-600 py-5">Connections</Link>
            <Link href="/settings" className="text-gray-500 hover:text-gray-900 transition-colors py-5 border-b-2 border-transparent hover:border-gray-200">Settings</Link>
        </nav>
      </header>

      <main className="pt-24 px-4 md:px-8 pb-12 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <Cloud className="w-6 h-6 text-blue-600" />
             Connections
           </h1>
           <Link href="/connections/add" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm shadow-sm flex items-center gap-2 transition-colors">
             <Plus className="w-4 h-4" />
             Add Source
           </Link>
        </div>

        <div className="space-y-4">
          {!hasSources ? (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
               <p className="text-gray-500 mb-4">No sources connected yet.</p>
               <Link href="/connections/add" className="text-blue-600 font-medium hover:underline">Add your first library source</Link>
            </div>
          ) : (
            userSources.map((source: any) => (
            <div key={source.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow group">
               <div className="p-3 bg-gray-50 rounded-lg text-gray-600 border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                 {source.type === 'public_url' ? <Globe className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
               </div>
               <div className="flex-1">
                 <div className="flex items-center justify-between mb-1">
                   <h3 className="font-semibold text-gray-900">{source.name}</h3>
                   <div className="flex gap-2">
                       <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${source.trust_level === 'high' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                         {source.trust_level} Trust
                       </span>
                       <Link href={`/connections/${source.id}/browse`} className="px-3 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                         Browse
                       </Link>
                   </div>
                 </div>
                 <p className="text-sm text-gray-500 mb-4 font-mono text-xs truncate max-w-md">{(source.config as any)?.url || source.type}</p>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                    <div>
                      <span className="block text-gray-400 mb-0.5">Sync Mode</span>
                      <span className="font-medium capitalize flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        {source.sync_mode.replace('_', ' ')}
                      </span>
                    </div>
                 </div>
               </div>
               <div className="flex flex-col gap-2">
                 <Link href={`/connections/${source.id}`} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                   <Settings className="w-5 h-5" />
                 </Link>
               </div>
            </div>
          )))}
        </div>
      </main>
    </div>
  );
}
