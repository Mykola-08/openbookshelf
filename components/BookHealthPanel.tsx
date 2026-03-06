import { AlertTriangle, Image, FileText, Tags, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BookHealthPanelProps {
  hasCover: boolean;
  hasDescription: boolean;
  hasGenres: boolean;
  hasISBN: boolean;
  aliasCount: number;
}

export function BookHealthPanel({ hasCover, hasDescription, hasGenres, hasISBN, aliasCount }: BookHealthPanelProps) {
  const issues: { icon: React.ElementType; label: string; severity: 'warning' | 'info' }[] = [];

  if (!hasCover) issues.push({ icon: Image, label: 'Missing cover image', severity: 'warning' });
  if (!hasDescription) issues.push({ icon: FileText, label: 'Missing description', severity: 'warning' });
  if (!hasGenres) issues.push({ icon: Tags, label: 'No genres or categories', severity: 'info' });
  if (!hasISBN) issues.push({ icon: Copy, label: 'No ISBN identifier', severity: 'info' });
  if (aliasCount > 2) issues.push({ icon: AlertTriangle, label: `${aliasCount} aliases — possible duplicate risk`, severity: 'warning' });

  if (issues.length === 0) return null;

  return (
    <Card className="bg-muted/20 border-none shadow-none">
      <CardContent className="p-6">
        <h3 className="font-medium text-foreground text-lg mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Book Health
        </h3>
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-background border">
              <issue.icon className={`w-4 h-4 shrink-0 ${issue.severity === 'warning' ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className="text-foreground">{issue.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
