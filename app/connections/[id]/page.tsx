import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectionSettingsForm } from "@/components/ConnectionSettingsForm";

export const dynamic = 'force-dynamic';

export default async function ConnectionSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: source } = await supabase.from('user_sources').select('*').eq('id', id).single();

  if (!source) return notFound();

  // Count items synced from this source
  const { count: itemCount } = await supabase
    .from('source_items')
    .select('*', { count: 'exact', head: true })
    .eq('source_id', id);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/connections"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Connections</Link>
      </Button>
      
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Connection Settings</h1>
        <p className="text-sm text-muted-foreground">Configure sync behavior, credentials, and connection health for this source.</p>
      </div>
      
      <ConnectionSettingsForm
        source={{
          id: source.id,
          name: source.name,
          type: source.type,
          config: source.config as Record<string, string>,
          syncMode: source.sync_mode,
          trustLevel: source.trust_level,
          automation: source.automation,
          conflictRule: source.conflict_rule,
          lastSyncedAt: source.last_synced_at,
          lastError: source.last_error,
          createdAt: source.created_at,
        }}
        itemCount={itemCount || 0}
      />
    </div>
  );
}
