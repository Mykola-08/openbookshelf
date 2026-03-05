const fs = require('fs');

let page = fs.readFileSync('app/page.tsx', 'utf8');

page = page.replace(
  'booksToDisplay.sort((a, b) => {',
  'booksToDisplay.sort((a: any, b: any) => {'
);
page = page.replace(
  'booksToDisplay.sort((a, b) => {',
  'booksToDisplay.sort((a: any, b: any) => {'
);

fs.writeFileSync('app/page.tsx', page);
console.log('Fixed typescript typing for sort');
