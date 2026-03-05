// Connections Page Update
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Plus, Settings, Globe, Lock, ArrowRightLeft, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: userSources } = await supabase.from('user_sources').select('*');

  // If no DB data, show "add new"
  const hasSources = userSources && userSources.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <main className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
             <Cloud className="w-8 h-8 text-blue-600" />
             Connections
           </h1>
           <Button asChild>
             <Link href="/connections/add" className="flex items-center gap-2">
               <Plus className="w-4 h-4" />
               Add Source
             </Link>
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!hasSources ? (
            <div className="col-span-1 md:col-span-2 text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
               <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <p className="text-gray-500 mb-4">No sources connected yet.</p>
               <Button variant="outline" asChild>
                  <Link href="/connections/add">Add your first library source</Link>
               </Button>
            </div>
          ) : (
            userSources.map((source: any) => (
            <Card key={source.id} className="group hover:shadow-md transition-all">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-50 rounded-md border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {source.type === 'public_url' ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1 max-w-[200px] truncate">
                      {(source.config as any)?.url || source.type}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={source.trust_level === 'high' ? 'default' : 'secondary'} className="uppercase">
                    {source.trust_level} Trust
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                 <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                    <div>
                      <span className="block text-gray-400 mb-0.5">Sync Mode</span>
                      <span className="font-medium capitalize flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        {source.sync_mode.replace('_', ' ')}
                      </span>
                    </div>
                 </div>
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                 <Button variant="secondary" size="sm" asChild>
                   <Link href={`/connections/${source.id}/browse`}>
                     Browse Catalog
                   </Link>
                 </Button>
                 <Button variant="ghost" size="icon" asChild>
                   <Link href={`/connections/${source.id}`} className="text-gray-400 hover:text-gray-900">
                     <Settings className="w-4 h-4" />
                     <span className="sr-only">Settings</span>
                   </Link>
                 </Button>
              </CardFooter>
            </Card>
          )))}
        </div>
      </main>
    </div>
  );
}
