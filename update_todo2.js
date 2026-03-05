const fs = require('fs');

let doc = fs.readFileSync('docs/ux-ui-master-todo-plan.md', 'utf8');
doc = doc.replace('- [ ] Add active state logic for all nested routes (book, reader, connections browse).', '- [x] Add active state logic for all nested routes (book, reader, connections browse).');
doc = doc.replace('- [ ] Add breadcrumb support on deep pages.', '- [x] Add breadcrumb support on deep pages.');
doc = doc.replace('- [ ] Improve mobile nav overflow behavior (horizontal tabs + sticky safe-area padding).', '- [x] Improve mobile nav overflow behavior (horizontal tabs + sticky safe-area padding).');
doc = doc.replace('- [ ] Add a command palette (`Ctrl/Cmd+K`) for quick navigate/import/search.', '- [x] Add a command palette (`Ctrl/Cmd+K`) for quick navigate/import/search.');
doc = doc.replace('- [ ] Add keyboard shortcut hints in tooltips for common actions.', '- [x] Add keyboard shortcut hints in tooltips for common actions.');

fs.writeFileSync('docs/ux-ui-master-todo-plan.md', doc);
console.log('Updated to-do list for App Shell.');
