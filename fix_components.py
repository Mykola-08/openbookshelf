import re

c = open('app/settings/page.tsx', 'r', encoding='utf-8').read()

s_start = c.find('const SectionCard = ({ children, title, description, badge }: any) => (')
if s_start != -1:
    s_end = c.find(');', s_start) + 2
    c = c[:s_start] + c[s_end:]

l_start = c.find('const ListItem = ({ children, isLast, title, description, action }: any) => (')
if l_start != -1:
    l_end = c.find(');', l_start) + 2
    c = c[:l_start] + c[l_end:]

c = c.replace('export default function SettingsPage() {', '''
const SectionCard = ({ children, title, description, badge }: any) => (
  <Card className="mb-8 border-border/40 shadow-none">
    <CardHeader className="flex flex-row items-center justify-between pb-4">
      <div className="space-y-1">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
      {badge && <Badge variant="secondary" className="font-normal">{badge}</Badge>}
    </CardHeader>
    <CardContent className="pt-0">
      {children}
    </CardContent>
  </Card>
);

const ListItem = ({ children, isLast, title, description, action }: any) => (
  <div className={cn("flex items-center justify-between gap-4")}>
    <div className="flex-1 space-y-1">
      <p className="text-sm font-medium leading-none">{title}</p>
      {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default function SettingsPage() {''')

open('app/settings/page.tsx', 'w', encoding='utf-8').write(c)

# book
c = open('components/BookCard.tsx', 'r', encoding='utf-8').read()
s_start = c.find('const SyncIcon = () => {')
if s_start != -1:
    s_end = c.find('};', s_start) + 2
    c = c[:s_start] + c[s_end:]

c = c.replace('export default function BookCard({ book, source }: BookCardProps) {', '''
const SyncIcon = ({ syncState }: { syncState: string | undefined }) => {
  const iconClass = "w-3 h-3";
  switch (syncState) {
    case 'synced': return <CheckCircle className={${iconClass} text-green-600} />;
    case 'pending': return <RefreshCw className={${iconClass} text-yellow-600} />;
    case 'locked': return <Lock className={${iconClass} text-gray-500} />;
    case 'conflict': return <AlertTriangle className={${iconClass} text-red-600} />;
    default: return null;
  }
};

export default function BookCard({ book, source }: BookCardProps) {''')
c = c.replace('<SyncIcon />', '<SyncIcon syncState={book.syncState} />')
open('components/BookCard.tsx', 'w', encoding='utf-8').write(c)

# source
c = open('components/SourceBadge.tsx', 'r', encoding='utf-8').read()
s_start = c.find('const Icon = () => {')
if s_start != -1:
    s_end = c.find('}', s_start + 20) + 1
    c = c[:s_start] + c[s_end:]
c = c.replace('export default function SourceBadge({ source }: { source: LibrarySource }) {', '''
const Icon = ({ type }: { type: string }) => {
  const iconClass = "w-3 h-3 text-gray-500";
  switch(type) {
    case 'calibre':
    case 'komga':
    case 'kavita':
      return <Server className={iconClass} />;
    case 'local':
      return <HardDrive className={iconClass} />;
    default:
      return <BookOpen className={iconClass} />;
  }
}

export default function SourceBadge({ source }: { source: LibrarySource }) {''')
c = c.replace('<Icon />', '<Icon type={source.type} />')
open('components/SourceBadge.tsx', 'w', encoding='utf-8').write(c)
