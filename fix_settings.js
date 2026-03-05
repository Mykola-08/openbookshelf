const fs = require('fs');

let page = fs.readFileSync('app/settings/page.tsx', 'utf8');

// The hook is called like: const { settings, setSetting, resetSettings } = useUserSettings({
page = page.replace(
    'const { settings, setSetting, resetSettings } = useUserSettings({', 
    'const { settings, setSetting, resetSettings, saveState } = useUserSettings({'
);

let headerHtml = `      <div className="space-y-1 mb-8 px-2 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground text-[15px]">
            Manage your account, preferences, and module integrations.
          </p>
        </div>
        <div className="flex items-center text-sm font-medium">
          {saveState === 'saving' && <span className="text-muted-foreground animate-pulse flex items-center gap-2"><div className="w-2 h-2 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin"/> Saving...</span>}
          {saveState === 'saved' && <span className="text-green-600 flex items-center gap-1">✓ Saved</span>}
          {saveState === 'error' && <span className="text-destructive flex items-center gap-1">✕ Error saving</span>}
        </div>
      </div>`;

page = page.replace(/<div className="space-y-1 mb-8 px-2">[\s\S]*?<\/div>/, headerHtml);

fs.writeFileSync('app/settings/page.tsx', page);
console.log('Added autosave status to settings page');
