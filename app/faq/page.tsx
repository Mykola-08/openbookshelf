import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FAQ_ITEMS = [
  {
    q: "How do I connect external libraries?",
    a: "Use Connections in the app for OPDS feeds, or call the External API endpoints with EXTERNAL_SYNC_TOKEN for automation.",
    tag: "Connectors",
  },
  {
    q: "How do I sync read/unread status from another app?",
    a: "POST to /api/v1/user-books/sync with user_id, book_id and progress. OpenBookshelf auto-resolves status/timestamps.",
    tag: "Sync",
  },
  {
    q: "Can I use Firebase instead of Supabase?",
    a: "Yes. Set NEXT_PUBLIC_DB_PROVIDER=firebase plus Firebase env vars. The app uses a Firebase REST compatibility client.",
    tag: "Database",
  },
  {
    q: "How do AI generation defaults work?",
    a: "Per-user AI settings in Settings → Preferences override provider/model/temperature/summary style for generation actions.",
    tag: "AI",
  },
  {
    q: "How do I backfill existing reading statuses?",
    a: "Run npm run sync:reading-status with Supabase URL + service role key to normalize old rows.",
    tag: "Migration",
  },
];

export default function FaqPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6 min-h-screen">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">FAQ & How-To</h1>
        <p className="text-muted-foreground">
          Quick answers for setup, sync, connectors, and automation workflows.
        </p>
      </header>

      <div className="grid gap-4">
        {FAQ_ITEMS.map((item) => (
          <Card key={item.q} className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{item.q}</CardTitle>
                <Badge variant="secondary">{item.tag}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-foreground/80">{item.a}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Need full API examples?</CardTitle>
          <CardDescription>
            See <span className="font-mono">docs/EXTERNAL_API.md</span> for request/response samples.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link className="text-sm text-primary underline underline-offset-4" href="/settings">
            Go to Settings
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
