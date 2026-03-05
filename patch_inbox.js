const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

if (!code.includes('MatchingInbox')) {
    code = code.replace('import { EmptyState } from "@/components/ui/empty-state";', 'import { EmptyState } from "@/components/ui/empty-state";\nimport MatchingInbox from "@/components/MatchingInbox";');

    const fetchMatchesCode = `
  const { data: pendingSources } = await supabase
    .from('source_items')
    .select('*, user_sources(*)')
    .in('sync_state', ['pending_create', 'conflict'])
    .limit(10);
    
  const pendingInboxItems = (pendingSources || []).map(item => ({
    id: item.id,
    sourceBook: {
      title: item.last_synced_data?.title || item.remote_id,
      author: item.last_synced_data?.author || "Unknown",
      cover: item.last_synced_data?.cover_url,
      sourceName: item.user_sources?.name || 'Unknown Source'
    },
    confidence: item.sync_state === 'conflict' ? 50 : 90
  }));
`;
    // Insert after booksToDisplay logic
    code = code.replace('const { data: userBooks, error } = await query;\n  let booksToDisplay = userBooks || [];', 'const { data: userBooks, error } = await query;\n  let booksToDisplay = userBooks || [];\n' + fetchMatchesCode);

    // Insert MatchingInbox UI right after the standard layout H1 element container
    const H1HtmlLine = `<h1 className="text-3xl font-bold tracking-tight text-foreground">`;
    const headerEndLine = `</div>\n          </div>`;
    
    code = code.replace(headerEndLine, headerEndLine + `\n\n          {pendingInboxItems.length > 0 && <MatchingInbox pendingMatches={pendingInboxItems} />}`);
    
    fs.writeFileSync('app/page.tsx', code);
    console.log('Added real inbox fetch to app/page.tsx');
}
