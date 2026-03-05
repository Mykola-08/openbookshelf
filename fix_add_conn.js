const fs = require('fs');

let page = fs.readFileSync('app/connections/add/page.tsx', 'utf8');

if (!page.includes("from 'sonner'")) {
    page = page.replace('import { Globe', 'import { toast } from "sonner";\nimport { Globe');
}

page = page.replace('alert("Failed to add source: " + error.message);', 'toast.error("Failed to add source: " + error.message);');

// Also update hardcoded colors
const replacements = [
    ['bg-gray-50', 'bg-background'],
    ['bg-white', 'bg-card'],
    ['border-gray-100', 'border-border'],
    ['text-gray-900', 'text-foreground'],
    [/text-gray-700/g, 'text-foreground'],
    [/text-gray-500/g, 'text-muted-foreground'],
    [/border-gray-300/g, 'border-input'],
    [/focus:ring-blue-500 focus:border-blue-500/g, 'focus:ring-primary focus:border-primary'],
    ['border-blue-500 bg-blue-50 text-blue-700', 'border-primary bg-primary/10 text-primary'],
    ['border-gray-200 hover:bg-gray-50', 'border-border hover:bg-accent/50'],
    ['hover:bg-gray-100', 'hover:bg-accent hover:text-accent-foreground'],
    ['bg-blue-600 hover:bg-blue-700', 'bg-primary hover:bg-primary/90 text-primary-foreground']
];

for (let rep of replacements) {
    page = page.replace(rep[0], rep[1]);
}

fs.writeFileSync('app/connections/add/page.tsx', page);
console.log('Fixed connections add page');
