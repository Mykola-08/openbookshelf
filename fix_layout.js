const fs = require('fs');
let code = fs.readFileSync('app/layout.tsx', 'utf8');

if (!code.includes('Toaster')) {
    code = `import { Toaster } from 'sonner';\n` + code;
    code = code.replace(/<body([^>]*)>/, '<body$1>\n        <Toaster position="top-center" richColors />');
    fs.writeFileSync('app/layout.tsx', code);
    console.log('Added Toaster to app/layout.tsx');
} else {
    console.log('Toaster already present in app/layout.tsx');
}
