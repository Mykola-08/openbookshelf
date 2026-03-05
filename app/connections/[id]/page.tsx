import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ConnectionSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: source } = await supabase.from('user_sources').select('*').eq('id', id).single();

  if (!source) return notFound();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href="/connections"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Connections</Link>
      </Button>
      
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings: {source.name}</h1>
      
      <div className="p-6 bg-muted/30 rounded-2xl border border-border/50">
        <p className="text-muted-foreground font-medium">Settings dashboard under construction.</p>
        <p className="text-sm text-muted-foreground mt-2">Here you will be able to configure sync modes, manage credentials, and view connection health.</p>
        <pre className="mt-6 p-4 bg-background rounded-xl border text-xs overflow-auto font-mono text-muted-foreground">
          {JSON.stringify(source, null, 2)}
        </pre>
      </div>
    </div>
  );
}
