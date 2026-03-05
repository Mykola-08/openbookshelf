const fs = require('fs');
let code = fs.readFileSync('app/layout.tsx', 'utf8');

if (!code.includes('CommandPalette')) {
    code = `import { CommandPalette } from '@/components/CommandPalette';\n` + code;
    code = code.replace(/<body([^>]*)>/, '<body$1>\n        <CommandPalette />');
    fs.writeFileSync('app/layout.tsx', code);
    console.log('Added CommandPalette to app/layout.tsx');
} else {
    console.log('CommandPalette already present in app/layout.tsx');
}
