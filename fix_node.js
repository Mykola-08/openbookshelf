const fs = require('fs');
let text = fs.readFileSync('app/settings/page.tsx', 'utf8');

text = text.replace('        <div className="flex-1 min-w-0 w-full space-y-6">\\n        <div className="flex-1 min-w-0 w-full space-y-6">', '        <div className="flex-1 min-w-0 w-full space-y-6">');
text = text.replace('</div>\\n      </div>\\n      </Tabs>', '</div>\\n      </Tabs>');

fs.writeFileSync('app/settings/page.tsx', text);
