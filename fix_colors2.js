const fs = require('fs');

function replaceInFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    for (let i = 0; i < replacements.length; i++) {
        content = content.replace(replacements[i][0], replacements[i][1]);
    }
    fs.writeFileSync(path, content);
}

replaceInFile('app/authors/page.tsx', [
    ['group-hover:text-blue-600', 'group-hover:text-primary']
]);

replaceInFile('app/series/page.tsx', [
    ['text-purple-500', 'text-primary'],
    ['group-hover:text-purple-700', 'group-hover:text-primary']
]);

replaceInFile('app/tracker/page.tsx', [
    ['text-blue-500', 'text-primary']
]);

console.log('Fixed more colors!');
