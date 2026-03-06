import re

with open('app/settings/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('</div>\\n      </div>\\n      </Tabs>', '</div>\n      </Tabs>')
text = text.replace('</div>\\\\n      </Tabs>', '</div>\n      </Tabs>')
text = text.replace('</TabsList>\\\\n        <div className="flex-1 min-w-0 w-full space-y-6">', '</TabsList>\n        <div className="flex-1 min-w-0 w-full space-y-6">')
text = text.replace('</TabsList>\\n        <div className="flex-1 min-w-0 w-full space-y-6">', '</TabsList>\n        <div className="flex-1 min-w-0 w-full space-y-6">')

with open('app/settings/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
