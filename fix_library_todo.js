const fs = require('fs');

let doc = fs.readFileSync('docs/ux-ui-master-todo-plan.md', 'utf8');

doc = doc.replace('- [ ] Real filters: status, rating, source, shelf, language, format.', '- [x] Real filters: status, rating, source, shelf, language, format.');
doc = doc.replace('- [ ] Sort controls: recent, title, author, progress, rating.', '- [x] Sort controls: recent, title, author, progress, rating.');
doc = doc.replace('- [ ] Persist filter/sort state in URL query params.', '- [x] Persist filter/sort state in URL query params.');
doc = doc.replace('- [ ] Add grid/list/dense view toggle.', '- [x] Add grid/list/dense view toggle.');
doc = doc.replace('- [ ] Add proper empty-state onboarding for first-time users.', '- [x] Add proper empty-state onboarding for first-time users.');
doc = doc.replace('- [ ] Deliver home/library filters + sorting + URL persistence.', '- [x] Deliver home/library filters + sorting + URL persistence.');

fs.writeFileSync('docs/ux-ui-master-todo-plan.md', doc);
console.log('Updated Phase 2 library tasks');
