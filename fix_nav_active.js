const fs = require('fs');
let code = fs.readFileSync('components/Navbar.tsx', 'utf8');

const oldLibraryPath = `pathname === '/' ? "bg-accent/60 text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"`;
const newLibraryPath = `(pathname === '/' || pathname.startsWith('/book/') || pathname.startsWith('/read/')) ? "bg-accent/60 text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"`;

const oldTrackerPath = `pathname === '/tracker' ? "bg-accent/60 text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"`;
const newTrackerPath = `pathname.startsWith('/tracker') ? "bg-accent/60 text-accent-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"`;

code = code.replace(oldLibraryPath, newLibraryPath);
code = code.replace(oldTrackerPath, newTrackerPath);

fs.writeFileSync('components/Navbar.tsx', code);
console.log('Fixed active state pathnames in Navbar.');
