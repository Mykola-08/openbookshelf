const fs = require('fs');
let text = fs.readFileSync('app/settings/page.tsx', 'utf8');

// The literal \\n is still there, I'll use regex to nuke the literal slash-n
text = text.replace(/\\n/g, '\n');

// Find the duplicated imports and declarations
text = text.replace(/import { Layout, Zap, Heart, ShieldCheck, Microscope, Layers } from "lucide-react";\n\nconst PRINCIPLES = \[[\s\S]*?\];\n/, '');

// Fix any duplicated tags:
if(text.match(/<div className="flex-1 min-w-0 w-full space-y-6">/g).length > 1) {
    text = text.replace(/<div className="flex-1 min-w-0 w-full space-y-6">\s*<div className="flex-1 min-w-0 w-full space-y-6">/, '<div className="flex-1 min-w-0 w-full space-y-6">');
}

fs.writeFileSync('app/settings/page.tsx', text);
