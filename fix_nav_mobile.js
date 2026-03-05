const fs = require('fs');
let code = fs.readFileSync('components/Navbar.tsx', 'utf8');

code = code.replace(
  'className="flex items-center px-4 md:px-8 h-12 w-full max-w-7xl mx-auto overflow-x-auto gap-1 scrollbar-hide text-sm"',
  'className="flex items-center px-4 md:px-8 h-12 w-full max-w-7xl mx-auto overflow-x-auto gap-1 scrollbar-hide text-sm pb-safe"'
);

fs.writeFileSync('components/Navbar.tsx', code);
console.log('Added pb-safe to Navbar');
