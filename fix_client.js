const fs = require('fs');

let aliasCode = fs.readFileSync('components/AliasReviewBoard.tsx', 'utf8');
if (aliasCode.startsWith("import { toast } from 'sonner';\n\"use client\";")) {
    aliasCode = aliasCode.replace("import { toast } from 'sonner';\n\"use client\";", "\"use client\";\nimport { toast } from 'sonner';");
    fs.writeFileSync('components/AliasReviewBoard.tsx', aliasCode);
}

// Actually better logic:
let lines = fs.readFileSync('components/AliasReviewBoard.tsx', 'utf8').split('\n');
if (lines[0].includes('import') && lines[1] && lines[1].includes('use client')) {
    let temp = lines[0];
    lines[0] = lines[1];
    lines[1] = temp;
    fs.writeFileSync('components/AliasReviewBoard.tsx', lines.join('\n'));
}

console.log('Fixed use client order');
