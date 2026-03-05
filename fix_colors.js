const fs = require('fs');

function replaceInFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    for (let i = 0; i < replacements.length; i++) {
        content = content.replace(replacements[i][0], replacements[i][1]);
    }
    fs.writeFileSync(path, content);
}

replaceInFile('app/authors/page.tsx', [
    ['bg-gray-50', 'bg-background'],
    ['text-gray-900', 'text-foreground'],
    [/text-gray-500/g, 'text-muted-foreground'],
    ['bg-gray-100', 'bg-secondary'],
    ['border-gray-200', 'border-border'],
    ['group-hover:border-blue-200', 'group-hover:border-primary/50'],
    ['text-gray-400 group-hover:text-blue-500', 'text-muted-foreground group-hover:text-primary']
]);

replaceInFile('app/series/page.tsx', [
    ['bg-gray-50', 'bg-background'],
    ['text-gray-900', 'text-foreground'],
    [/text-gray-500/g, 'text-muted-foreground'],
    ['bg-purple-50', 'bg-primary/10'],
    ['border-purple-100', 'border-primary/20'],
    ['group-hover:bg-purple-100', 'group-hover:bg-primary/20']
]);

replaceInFile('components/connections/RemoteBookItem.tsx', [
    [/bg-gray-100/g, 'bg-secondary'],
    ['text-gray-400', 'text-muted-foreground'],
    ['text-gray-900', 'text-foreground'],
    [/text-gray-500/g, 'text-muted-foreground'],
    ['text-gray-600', 'text-secondary-foreground'],
    ['text-gray-400', 'text-muted-foreground'],
    ["'bg-blue-50 text-blue-600 hover:bg-blue-100'", "'bg-primary/10 text-primary hover:bg-primary/20'"],
    ["'bg-gray-100 text-gray-500 cursor-wait'", "'bg-secondary text-muted-foreground cursor-wait'"]
]);

console.log('Fixed hardcoded colors!');
