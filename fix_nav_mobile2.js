const fs = require('fs');
let css = fs.readFileSync('app/globals.css', 'utf8');

if (!css.includes('.pb-safe')) {
    css += `
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }
  .pt-safe {
    padding-top: env(safe-area-inset-top);
  }
}
`;
    fs.writeFileSync('app/globals.css', css);
    console.log('Added safe area classes to globals.css');
}

let code = fs.readFileSync('components/Navbar.tsx', 'utf8');
code = code.replace(
  'className="flex items-center px-4 md:px-8 h-12 w-full max-w-7xl mx-auto overflow-x-auto gap-1 scrollbar-hide text-sm"',
  'className="flex items-center px-4 md:px-8 h-12 w-full max-w-7xl mx-auto overflow-x-auto gap-1 scrollbar-hide text-sm pb-safe pt-1"'
);
fs.writeFileSync('components/Navbar.tsx', code);
console.log('Added pb-safe to Navbar nav');
