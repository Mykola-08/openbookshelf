import re
with open('lib/config/modules.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the duplication I just added
text = re.sub(r'  \{\s*id: "ai_generation",\s*title: "AI Generation",.*?category: "platform",\s*\},', '', text, flags=re.DOTALL)

with open('lib/config/modules.ts', 'w', encoding='utf-8') as f:
    f.write(text)
