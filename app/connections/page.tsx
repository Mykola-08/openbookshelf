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
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex items-end justify-between">
           <div>
             <h1 className="text-2xl font-semibold tracking-tight text-foreground">
               Connections
             </h1>
             <p className="text-sm text-muted-foreground mt-0.5">Manage your connected OPDS catalogs and external sources.</p>
           </div>
           <Button asChild size="sm" className="rounded-lg">
             <Link href="/connections/add" className="flex items-center gap-1.5">
               <Plus className="w-3.5 h-3.5" />
               Add Source
             </Link>
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {!hasSources ? (
            <div className="col-span-1 md:col-span-2 text-center py-16 bg-muted/10 rounded-xl border border-dashed border-border/40 text-muted-foreground">
               <Cloud className="w-10 h-10 mx-auto mb-3 opacity-20" />
               <p className="mb-4 text-sm font-medium">No sources connected yet</p>
               <Button variant="outline" size="sm" asChild className="rounded-lg">
                  <Link href="/connections/add">Connect your first library</Link>
               </Button>
            </div>
          ) : (
            userSources.map((source: any) => (
            <Card key={source.id} className="group hover:shadow-md transition-all rounded-xl border-border/40 bg-card/50 overflow-hidden">
              <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-start justify-between space-y-0 relative border-b border-border/30 bg-muted/5">
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2.5 bg-background rounded-lg border border-border/30 group-hover:border-foreground/10 transition-colors shrink-0">
                    {source.type === 'public_url' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 pr-4">
                    <CardTitle className="text-[15px] font-medium truncate">{source.name}</CardTitle>
                    <CardDescription className="font-mono text-[11px] mt-0.5 truncate">
                      {(source.config as any)?.url || source.type}
                    </CardDescription>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant={source.trust_level === 'high' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider rounded-lg px-2">
                    {source.trust_level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-4 px-4 space-y-2.5">
                 <div className="flex items-center justify-between text-sm text-foreground bg-muted/30 p-2.5 rounded-lg border border-border/30">
                    <div>
                      <span className="block text-muted-foreground text-[10px] mb-0.5 uppercase tracking-wider">Sync</span>
                      <span className="font-medium text-sm capitalize flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                        {source.sync_mode.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-muted-foreground text-[10px] mb-0.5 uppercase tracking-wider">Last Synced</span>
                      <span className="font-medium text-xs">
                        {source.last_synced_at
                          ? new Date(source.last_synced_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : 'Never'}
                      </span>
                    </div>
                 </div>
                 {source.last_error && (
                   <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                     <Settings className="w-3.5 h-3.5 shrink-0" />
                     <span className="truncate">{source.last_error}</span>
                   </div>
                 )}
              </CardContent>
              <CardFooter className="px-4 pb-4 pt-0 flex justify-between gap-2">
                 <Button variant="secondary" size="sm" className="flex-1 rounded-lg" asChild>
                   <Link href={`/connections/${source.id}/browse`}>
                     Browse
                   </Link>
                 </Button>
                 <Button variant="outline" size="icon" className="rounded-lg shrink-0 border-border/40 h-9 w-9" asChild>
                   <Link href={`/connections/${source.id}`}>
                     <Settings className="w-3.5 h-3.5 text-muted-foreground" />
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
