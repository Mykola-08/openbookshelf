const fs = require('fs');
let text = fs.readFileSync('app/settings/page.tsx', 'utf8');

text = text.replace('        <TabsContent value="philosophy"', '        )}\n        <TabsContent value="philosophy"');

fs.writeFileSync('app/settings/page.tsx', text);

