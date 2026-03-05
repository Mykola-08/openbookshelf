const fs = require('fs');

// Fix AliasReviewBoard
let aliasCode = fs.readFileSync('components/AliasReviewBoard.tsx', 'utf8');
aliasCode = aliasCode.replace('const result = const result =', 'const result =');
fs.writeFileSync('components/AliasReviewBoard.tsx', aliasCode);

// Fix BookCard import in app/search/page.tsx
let searchCode = fs.readFileSync('app/search/page.tsx', 'utf8');
searchCode = searchCode.replace('import { BookCard } from "@/components/BookCard";', 'import BookCard from "@/components/BookCard";');
fs.writeFileSync('app/search/page.tsx', searchCode);

console.log('Fixed syntax and imports');
