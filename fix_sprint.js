const fs = require('fs');

let doc = fs.readFileSync('docs/ux-ui-master-todo-plan.md', 'utf8');

doc = doc.replace('- [ ] Replace hardcoded grays/blues/purples in pages with tokenized semantic colors.', '- [x] Replace hardcoded grays/blues/purples in pages with tokenized semantic colors.');
doc = doc.replace('- [ ] Create consistent state components: empty/error/loading/success.', '- [x] Create consistent state components: empty/error/loading/success.');
doc = doc.replace('- [ ] Add autosave status label in settings (`saving`, `saved`, `error`).', '- [x] Add autosave status label in settings (`saving`, `saved`, `error`).');
doc = doc.replace('- [ ] Replace `alert()` usage with accessible toast notifications.', '- [x] Replace `alert()` usage with accessible toast notifications.');

doc = doc.replace(/> - \[ \] Complete all `Phase 0` blocker tasks./, '> - [x] Complete all `Phase 0` blocker tasks.');
doc = doc.replace('- [ ] Ship global toasts, error states, and working search results route.', '- [x] Ship global toasts, error states, and working search results route.');

fs.writeFileSync('docs/ux-ui-master-todo-plan.md', doc);
console.log('Updated sprint progress');
