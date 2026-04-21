import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
import { getRuntimeHealthReport } from "@/lib/config/runtime-health";

export default function SetupPage() {
  const report = getRuntimeHealthReport();

  return (
    <PageShell width="narrow" as="main" className="space-y-6">
      <PageHeader
        title="Setup & Runtime Health"
        description="Validate backend readiness, integration settings, reader/tracker modules, and AI connectivity."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Overall status
            <Badge variant={report.ready ? "default" : "secondary"}>{report.ready ? "Ready" : "Action Needed"}</Badge>
          </CardTitle>
          <CardDescription>Provider: {report.provider}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {report.checks.map((check) => (
          <Card key={check.id} className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {check.label}
                <Badge variant={check.ok ? "default" : "outline"}>{check.ok ? "OK" : "Needs config"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{check.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Link href="/settings" className="underline underline-offset-4 text-primary">Open Settings</Link>
          <Link href="/faq" className="underline underline-offset-4 text-primary">Open FAQ</Link>
          <Link href="/discover" className="underline underline-offset-4 text-primary">Open Discover</Link>
        </CardContent>
      </Card>
    </PageShell>
  );
}
