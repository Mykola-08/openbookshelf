import sys
with open('app/actions/ai-generate.ts', 'r', encoding='utf-8') as f: text = f.read()
text = text.replace('${title}" by ${author}', '${book.title}" ${book.authors?.name ? "by " + book.authors.name : ""}')
text = text.replace('${bookTitle}', '${book.title}')
with open('app/actions/ai-generate.ts', 'w', encoding='utf-8') as f: f.write(text)

with open('app/settings/page.tsx', 'r', encoding='utf-8') as f: text = f.read()
text = text.replace('setSetting("summaryDepth", e.target.value)', 'setSetting("summaryDepth", e.target.value as any)')
with open('app/settings/page.tsx', 'w', encoding='utf-8') as f: f.write(text)
