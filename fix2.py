import re

with open('app/settings/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    '</TabsList>\\n        <div className="flex-1 min-w-0 w-full space-y-6">\\n        <div className="flex-1 min-w-0 w-full space-y-6">', 
    '</TabsList>\\n        <div className="flex-1 min-w-0 w-full space-y-6">'
)

text = re.sub(r'</div>\\n\\s*</div>\\n\\s*</Tabs>', '</div>\\n      </Tabs>', text)
text = re.sub(r'</TabsList>.+?<div className="flex-1 min-w-0 w-full space-y-6">', '</TabsList>\\n        <div className="flex-1 min-w-0 w-full space-y-6">', text)

with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
