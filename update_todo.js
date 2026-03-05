const fs = require('fs');

let doc = fs.readFileSync('docs/ux-ui-master-todo-plan.md', 'utf8');
doc = doc.replace('- [ ] Implement global search results page.', '- [x] Implement global search results page.');
doc = doc.replace('- [ ] Add error toasts and success confirmations for all write actions.', '- [x] Add error toasts and success confirmations for all write actions.');
doc = doc.replace('- [ ] Ensure all CTA buttons do real actions or are explicitly marked disabled with explanation.', '- [x] Ensure all CTA buttons do real actions or are explicitly marked disabled with explanation.');

fs.writeFileSync('docs/ux-ui-master-todo-plan.md', doc);
console.log('Updated to-do list.');
