import re
with open('lib/config/modules.ts', 'r', encoding='utf-8') as f:
    text = f.read()

replacement = '''    category: "platform",
  },
  {
    id: "ai_generation",
    title: "AI Generation",
    description: "Enable AI capabilities (Google/OpenAI/OpenRouter) for descriptions and summaries.",
    category: "platform",
  },'''

new_text = re.sub(r'category: "platform",\s*\},', replacement, text, count=1)
with open('lib/config/modules.ts', 'w', encoding='utf-8') as f:
    f.write(new_text)
