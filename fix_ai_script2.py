import sys

with open('app/actions/ai-generate.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import re
# Replace the bad prompts
text = re.sub(r'const prompt = .*?plain text and compelling.\;', 'const prompt = `Provide a short, engaging description (about 150-200 words) for the book "${title}" by ${author}. Under no circumstances use markdown or codeblocks. Make it plain text and compelling.`;', text)

text = re.sub(r'const prompt = .*?plain text without markdown.\;', 'const prompt = `Provide a brief, concise summary (about 50-75 words) of the chapter "${chapterTitle}" from the book "${bookTitle}". Avoid spoilers of the very ending of the chapter if possible, and just give an overview of events. Respond in plain text without markdown.`;', text)

with open('app/actions/ai-generate.ts', 'w', encoding='utf-8') as f:
    f.write(text)
