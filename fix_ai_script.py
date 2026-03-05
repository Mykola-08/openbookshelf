import sys
with open('app/actions/ai-generate.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(r'const prompt = \Provide a short, engaging description (about 150-200 words) for the book "\" \. Under no circumstances use markdown or codeblocks. Make it plain text and compelling.\;', 'const prompt = Provide a short, engaging description (about 150-200 words) for the book "" by . Under no circumstances use markdown or codeblocks. Make it plain text and compelling.;')

text = text.replace(r'const prompt = \Provide a brief, concise summary (about 50-75 words) of the chapter "\" from the book "\" \. Avoid spoilers of the very ending of the chapter if possible, and just give an overview of events. Respond in plain text without markdown.\;', 'const prompt = Provide a brief, concise summary (about 50-75 words) of the chapter "" from the book "". Avoid spoilers of the very ending of the chapter if possible, and just give an overview of events. Respond in plain text without markdown.;')

with open('app/actions/ai-generate.ts', 'w', encoding='utf-8') as f:
    f.write(text)
