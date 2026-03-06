const fs = require('fs');
let lines = fs.readFileSync('app/settings/page.tsx', 'utf8').split('\n');

let inDupBlock = false;
let foundOnce = false;

lines = lines.filter(line => {
    if (line.includes('import { Layout, Zap, Heart, ShieldCheck,')) {
        if (foundOnce) {
            inDupBlock = true;
            return false;
        }
        foundOnce = true;
    }
    
    if (inDupBlock) {
        if (line.includes('];')) {
            inDupBlock = false;
        }
        return false;
    }
    return true;
});

let text = lines.join('\n');
text = text.replace(/\\n/g, '\n');

// Also check for multiple div class flex-1
text = text.replace(/<div className="flex-1 min-w-0 w-full space-y-6">\s*<div className="flex-1 min-w-0 w-full space-y-6">/g, '<div className="flex-1 min-w-0 w-full space-y-6">');
text = text.replace(/<\/TabsList>\s*<div className="flex-1 min-w-0 w-full space-y-6">\s*<div className="flex-1 min-w-0 w-full space-y-6">/g, '</TabsList>\n        <div className="flex-1 min-w-0 w-full space-y-6">');

fs.writeFileSync('app/settings/page.tsx', text);
