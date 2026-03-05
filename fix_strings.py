content = open('app/page.tsx', 'r', encoding='utf-8').read()
content = content.replace('href={"/book/book.id"}', 'href={/book/}')
content = content.replace('href={"/read/book.id"}', 'href={/read/}')
open('app/page.tsx', 'w', encoding='utf-8').write(content)
