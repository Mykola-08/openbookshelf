const fs = require('fs');
let doc = fs.readFileSync('docs/ux-ui-master-todo-plan.md', 'utf8');
doc = doc.replace('- [ ] Replace mock inbox with real pending import/merge queue.', '- [x] Replace mock inbox with real pending import/merge queue.');
fs.writeFileSync('docs/ux-ui-master-todo-plan.md', doc);
console.log('Checked off matching inbox task');
