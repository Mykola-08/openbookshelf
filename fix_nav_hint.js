const fs = require('fs');
let code = fs.readFileSync('components/Navbar.tsx', 'utf8');

code = code.replace(
  'placeholder="Search books, authors, series..."',
  'placeholder="Search... (Ctrl+K)"'
);

fs.writeFileSync('components/Navbar.tsx', code);
console.log('Fixed Navbar hint');
