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
      <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-10">
        <div className="flex items-end justify-between border-b pb-6">
           <div className="space-y-1">
             <h1 className="text-3xl font-semibold tracking-tight text-foreground flex items-center gap-2">
               <Cloud className="w-8 h-8 text-primary" />
               Connections
             </h1>
             <p className="text-sm text-muted-foreground">Manage your connected OPDS catalogs and external sources</p>
           </div>
           <Button asChild className="rounded-full">
             <Link href="/connections/add" className="flex items-center gap-2">
               <Plus className="w-4 h-4" />
               Add Source
             </Link>
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!hasSources ? (
            <div className="col-span-1 md:col-span-2 text-center py-20 bg-muted/20 rounded-2xl border border-dashed text-muted-foreground">
               <Cloud className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p className="mb-6 font-medium">No sources connected yet</p>
               <Button variant="outline" asChild className="rounded-full">
                  <Link href="/connections/add">Connect your first library</Link>
               </Button>
            </div>
          ) : (
            userSources.map((source: any) => (
            <Card key={source.id} className="group hover:shadow-md transition-all rounded-2xl border-border/60 bg-card overflow-hidden">
              <CardHeader className="pb-4 pt-5 px-5 flex flex-row items-start justify-between space-y-0 relative border-b border-border/40 bg-muted/10">
                <div className="flex items-center gap-3 w-full">
                  <div className="p-3 bg-background rounded-xl border group-hover:border-primary/30 group-hover:text-primary transition-colors shadow-sm shrink-0">
                    {source.type === 'public_url' ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 pr-4">
                    <CardTitle className="text-lg font-medium truncate">{source.name}</CardTitle>
                    <CardDescription className="font-mono text-[11px] mt-1 truncate">
                      {(source.config as any)?.url || source.type}
                    </CardDescription>
                  </div>
                </div>
                <div className="absolute top-5 right-5">
                  <Badge variant={source.trust_level === 'high' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider rounded-full px-2">
                    {source.trust_level} Trust
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-5 px-5">
                 <div className="flex items-center justify-between text-sm text-foreground bg-secondary/60 p-3 rounded-xl border border-border/50">
                    <div>
                      <span className="block text-muted-foreground text-xs mb-0.5">Sync Mode</span>
                      <span className="font-medium capitalize flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                        {source.sync_mode.replace('_', ' ')}
                      </span>
                    </div>
                 </div>
              </CardContent>
              <CardFooter className="px-5 pb-5 pt-0 flex justify-between gap-3">
                 <Button variant="secondary" className="flex-1 rounded-xl" asChild>
                   <Link href={`/connections/${source.id}/browse`}>
                     Browse Catalog
                   </Link>
                 </Button>
                 <Button variant="outline" size="icon" className="rounded-xl shrink-0 border-border/60" asChild>
                   <Link href={`/connections/${source.id}`}>
                     <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
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
