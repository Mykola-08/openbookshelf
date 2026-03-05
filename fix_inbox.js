const fs = require('fs');

const replacements = [
    ['bg-white', 'bg-card'],
    ['border-gray-200', 'border-border'],
    ['bg-blue-50', 'bg-muted/50'],
    ['border-blue-100', 'border-border'],
    ['text-blue-900', 'text-foreground'],
    ['text-blue-700', 'text-primary'],
    ['bg-blue-200', 'bg-primary/20'],
    ['text-blue-800', 'text-primary'],
    ['bg-gray-50', 'bg-secondary/30'],
    ['border-gray-100', 'border-border'],
    ['text-gray-900', 'text-foreground'],
    ['text-gray-500', 'text-muted-foreground'],
    ['text-gray-400', 'text-muted-foreground/50'],
    ['bg-green-50 text-green-700', 'bg-green-500/10 text-green-600'],
    ['bg-yellow-50 text-yellow-700', 'bg-yellow-500/10 text-yellow-600'],
    ['border-gray-300', 'border-border'],
    ['bg-blue-600 hover:bg-blue-700 text-white', 'bg-primary hover:bg-primary/90 text-primary-foreground'],
    ['text-gray-700 bg-white hover:bg-gray-50 border-gray-300', 'text-foreground bg-background hover:bg-accent border-input']
];

function replaceAll(content, search, replace) {
    return content.split(search).join(replace);
}

let code = fs.readFileSync('components/MatchingInbox.tsx', 'utf8');

for (let r of replacements) {
    code = replaceAll(code, r[0], r[1]);
}
code = code.replace(/text-gray-800/g, 'text-foreground');
code = code.replace(/text-gray-600/g, 'text-muted-foreground');

fs.writeFileSync('components/MatchingInbox.tsx', code);
console.log('Fixed MatchingInbox colors');
