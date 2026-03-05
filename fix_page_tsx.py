import codecs
with codecs.open('app/page.tsx', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace('href={"/book/book.id"}', 'href={/book/}')
content = content.replace('href={"/read/book.id"}', 'href={/read/}')

with codecs.open('app/page.tsx', 'w', 'utf-8') as f:
    f.write(content)
